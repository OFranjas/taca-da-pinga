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
        { drinkId: 'sangria', quantity: 1 },
        { drinkId: 'white-spirit', quantity: 1 },
      ],
    });

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { col: 'teams', id: 'team1' },
      {
        pingas: { __op: 'increment', n: 8 },
        'drinkTotals.beer.quantity': { __op: 'increment', n: 2 },
        'drinkTotals.beer.pingas': { __op: 'increment', n: 2 },
        'drinkTotals.sangria.quantity': { __op: 'increment', n: 1 },
        'drinkTotals.sangria.pingas': { __op: 'increment', n: 1 },
        'drinkTotals.white-spirit.quantity': { __op: 'increment', n: 1 },
        'drinkTotals.white-spirit.pingas': { __op: 'increment', n: 5 },
      }
    );
    expect(mockBatchSet).toHaveBeenCalledWith(expect.anything(), {
      ts: 'server-ts',
      actorUid: 'u1',
      type: 'add-pinga',
      delta: 8,
      teamId: 'team1',
      schemaVersion: 2,
      items: [
        { drinkId: 'beer', drinkName: 'Cerveja', pingaValue: 1, quantity: 2, lineDelta: 2 },
        {
          drinkId: 'sangria',
          drinkName: 'Sangria',
          pingaValue: 1,
          quantity: 1,
          lineDelta: 1,
        },
        {
          drinkId: 'white-spirit',
          drinkName: 'Bebida branca',
          pingaValue: 5,
          quantity: 1,
          lineDelta: 5,
        },
      ],
    });
    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });

  test('addDrinkPingas consolidates duplicate drink selections', async () => {
    const { addDrinkPingas } = await import('../leaderboard');

    await addDrinkPingas({
      teamId: 'team1',
      items: [
        { drinkId: 'metro', quantity: 1 },
        { drinkId: 'metro', quantity: 2 },
      ],
    });

    expect(mockBatchUpdate).toHaveBeenCalledWith(
      { col: 'teams', id: 'team1' },
      expect.objectContaining({
        pingas: { __op: 'increment', n: 33 },
        'drinkTotals.metro.quantity': { __op: 'increment', n: 3 },
        'drinkTotals.metro.pingas': { __op: 'increment', n: 33 },
      })
    );
    expect(mockBatchSet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        delta: 33,
        items: [
          { drinkId: 'metro', drinkName: 'Metro', pingaValue: 11, quantity: 3, lineDelta: 33 },
        ],
      })
    );
  });

  test.each([
    ['unknown drink', [{ drinkId: 'unknown', quantity: 1 }], 'Unknown or inactive drink'],
    ['invalid quantity', [{ drinkId: 'beer', quantity: 0 }], 'positive integers'],
    ['negative quantity', [{ drinkId: 'beer', quantity: -1 }], 'positive integers'],
    ['non-integer quantity', [{ drinkId: 'beer', quantity: 1.5 }], 'positive integers'],
    ['empty selection', [], 'At least one drink is required'],
  ])('addDrinkPingas rejects %s', async (_label, items, message) => {
    const { addDrinkPingas } = await import('../leaderboard');
    await expect(addDrinkPingas({ teamId: 'team1', items })).rejects.toThrow(message);
    expect(mockBatchCommit).not.toHaveBeenCalled();
  });

  test('addDrinkPingas rejects a configured drink when it is inactive', async () => {
    const { DRINK_CATALOGUE } = await import('../../config/drinks');
    const drink = DRINK_CATALOGUE.find((item) => item.id === 'cider');
    const originalActive = drink.active;
    drink.active = false;

    try {
      const { addDrinkPingas } = await import('../leaderboard');
      await expect(
        addDrinkPingas({ teamId: 'team1', items: [{ drinkId: 'cider', quantity: 1 }] })
      ).rejects.toThrow('Unknown or inactive drink');
      expect(mockBatchCommit).not.toHaveBeenCalled();
    } finally {
      drink.active = originalActive;
    }
  });

  test('addDrinkPingas rejects totals below 1 or above 50', async () => {
    const { addDrinkPingas } = await import('../leaderboard');
    await expect(
      addDrinkPingas({ teamId: 'team1', items: [{ drinkId: 'beer', quantity: 51 }] })
    ).rejects.toThrow('between 1 and 50');
    await expect(
      addDrinkPingas({ teamId: 'team1', items: [{ drinkId: 'metro', quantity: 5 }] })
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
