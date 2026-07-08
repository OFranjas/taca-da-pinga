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
