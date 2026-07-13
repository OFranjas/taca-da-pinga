vi.mock('../../firebase', () => ({ db: {} }));

const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn((field, dir) => ({ field, dir }));
const mockGetDocs = vi.fn();
const mockOnSnapshot = vi.fn();
const mockDoc = vi.fn((db, col, id) => ({ col, id }));
const mockUpdateDoc = vi.fn();
const mockIncrement = vi.fn((n) => ({ __op: 'increment', n }));
const mockLimit = vi.fn((n) => ({ __op: 'limit', n }));
const mockServerTimestamp = vi.fn(() => 'server-ts');
const mockBatchUpdate = vi.fn();
const mockBatchSet = vi.fn();
const mockBatchCommit = vi.fn();
const mockWriteBatch = vi.fn(() => ({
  update: mockBatchUpdate,
  set: mockBatchSet,
  commit: mockBatchCommit,
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  getDocs: (...args) => mockGetDocs(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  doc: (...args) => mockDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  increment: (...args) => mockIncrement(...args),
  limit: (...args) => mockLimit(...args),
  serverTimestamp: (...args) => mockServerTimestamp(...args),
  writeBatch: (...args) => mockWriteBatch(...args),
}));

describe('services/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchCommit.mockResolvedValue(undefined);
  });

  test('getLeaderboard returns mapped teams', async () => {
    const { getLeaderboard } = await import('../leaderboard');
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'a', data: () => ({ name: 'A', pingas: 2 }) },
        { id: 'b', data: () => ({ name: 'B', pingas: 1 }) },
      ],
    });

    const res = await getLeaderboard();
    expect(mockCollection).toHaveBeenCalledWith({}, 'teams');
    expect(mockOrderBy).toHaveBeenCalledWith('pingas', 'desc');
    expect(res).toEqual([
      { id: 'a', name: 'A', pingas: 2 },
      { id: 'b', name: 'B', pingas: 1 },
    ]);
  });

  test('observeLeaderboard calls back with mapped teams and returns unsubscribe', async () => {
    const { observeLeaderboard } = await import('../leaderboard');
    let internalCb;
    mockOnSnapshot.mockImplementation((q, cb) => {
      internalCb = cb;
      return () => 'unsub';
    });
    const cb = vi.fn();
    const unsub = observeLeaderboard(cb);
    expect(typeof unsub).toBe('function');

    // Simulate a snapshot
    internalCb({
      docs: [{ id: 'x', data: () => ({ name: 'X', pingas: 9 }) }],
    });
    expect(cb).toHaveBeenCalledWith([{ id: 'x', name: 'X', pingas: 9 }]);
  });

  test('addPinga validates delta and updates doc with increment', async () => {
    const { addPinga } = await import('../leaderboard');
    await addPinga('team1', 3, 'u1');
    expect(mockDoc).toHaveBeenCalledWith({}, 'teams', 'team1');
    expect(mockCollection).toHaveBeenCalledWith({}, 'events');
    expect(mockIncrement).toHaveBeenCalledWith(3);
    expect(mockWriteBatch).toHaveBeenCalledWith({});
    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { col: 'teams', id: 'team1' },
      { pingas: { __op: 'increment', n: 3 } }
    );
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        actorUid: 'u1',
        delta: 3,
        teamId: 'team1',
        ts: 'server-ts',
        type: 'add-pinga',
      })
    );
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  test('addPinga throws on invalid delta', async () => {
    const { addPinga } = await import('../leaderboard');
    await expect(addPinga('team1', 0)).rejects.toThrow('Delta must be an integer between 1 and 50');
    await expect(addPinga('team1', 51)).rejects.toThrow(
      'Delta must be an integer between 1 and 50'
    );
  });

  test.each(['', ' team1', 'team1 ', 'team/1'])(
    'addDrinkPingas rejects invalid team IDs: %j',
    async (teamId) => {
      const { addDrinkPingas } = await import('../leaderboard');
      await expect(
        addDrinkPingas({ teamId, items: [{ drinkId: 'beer', quantity: 1 }] })
      ).rejects.toThrow('Team ID must be a non-empty Firestore document ID');
      expect(mockBatchCommit).not.toHaveBeenCalled();
    }
  );

  test('addDrinkPingas derives a mixed-drink total and writes the exact projection and receipt', async () => {
    const { addDrinkPingas } = await import('../leaderboard');

    await addDrinkPingas({
      teamId: 'team1',
      actorUid: 'u1',
      items: [
        { drinkId: 'beer', quantity: 2 },
        { drinkId: 'shot', quantity: 1 },
        { drinkId: 'cider', quantity: 3 },
      ],
    });

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { col: 'teams', id: 'team1' },
      {
        pingas: { __op: 'increment', n: 7 },
        'drinkTotals.beer.quantity': { __op: 'increment', n: 2 },
        'drinkTotals.beer.pingas': { __op: 'increment', n: 2 },
        'drinkTotals.shot.quantity': { __op: 'increment', n: 1 },
        'drinkTotals.shot.pingas': { __op: 'increment', n: 2 },
        'drinkTotals.cider.quantity': { __op: 'increment', n: 3 },
        'drinkTotals.cider.pingas': { __op: 'increment', n: 3 },
      }
    );
    expect(mockBatchSet).toHaveBeenCalledWith(expect.anything(), {
      ts: 'server-ts',
      actorUid: 'u1',
      type: 'add-pinga',
      delta: 7,
      teamId: 'team1',
      schemaVersion: 2,
      items: [
        { drinkId: 'beer', drinkName: 'Cerveja', pingaValue: 1, quantity: 2, lineDelta: 2 },
        { drinkId: 'shot', drinkName: 'Shot', pingaValue: 2, quantity: 1, lineDelta: 2 },
        { drinkId: 'cider', drinkName: 'Sidra', pingaValue: 1, quantity: 3, lineDelta: 3 },
      ],
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  test('addDrinkPingas consolidates duplicate drink selections', async () => {
    const { addDrinkPingas } = await import('../leaderboard');

    await addDrinkPingas({
      teamId: 'team1',
      items: [
        { drinkId: 'shot', quantity: 1 },
        { drinkId: 'shot', quantity: 2 },
      ],
    });

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { col: 'teams', id: 'team1' },
      expect.objectContaining({
        pingas: { __op: 'increment', n: 6 },
        'drinkTotals.shot.quantity': { __op: 'increment', n: 3 },
        'drinkTotals.shot.pingas': { __op: 'increment', n: 6 },
      })
    );
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        delta: 6,
        items: [{ drinkId: 'shot', drinkName: 'Shot', pingaValue: 2, quantity: 3, lineDelta: 6 }],
      })
    );
  });

  test.each([
    ['unknown drink', [{ drinkId: 'unknown', quantity: 1 }], 'Unknown or inactive drink'],
    ['inactive drink', [{ drinkId: 'wine', quantity: 1 }], 'Unknown or inactive drink'],
    ['invalid quantity', [{ drinkId: 'beer', quantity: 0 }], 'positive integers'],
    ['negative quantity', [{ drinkId: 'beer', quantity: -1 }], 'positive integers'],
    ['non-integer quantity', [{ drinkId: 'beer', quantity: 1.5 }], 'positive integers'],
    ['empty selection', [], 'At least one drink is required'],
  ])('addDrinkPingas rejects %s', async (_label, items, message) => {
    const { addDrinkPingas } = await import('../leaderboard');
    await expect(addDrinkPingas({ teamId: 'team1', items })).rejects.toThrow(message);
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  test('addDrinkPingas rejects totals below 1 or above 50', async () => {
    const { addDrinkPingas } = await import('../leaderboard');
    await expect(
      addDrinkPingas({ teamId: 'team1', items: [{ drinkId: 'beer', quantity: 51 }] })
    ).rejects.toThrow('between 1 and 50');
    await expect(
      addDrinkPingas({ teamId: 'team1', items: [{ drinkId: 'shot', quantity: 26 }] })
    ).rejects.toThrow('between 1 and 50');
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  test('listEvents applies ordering and limit and maps docs', async () => {
    const { listEvents } = await import('../leaderboard');
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'e1', data: () => ({ type: 'add', ts: 1 }) }],
    });
    const res = await listEvents(5);
    expect(mockCollection).toHaveBeenCalledWith({}, 'events');
    expect(mockOrderBy).toHaveBeenCalledWith('ts', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(5);
    expect(res).toEqual([{ id: 'e1', type: 'add', ts: 1 }]);
  });
});
