jest.mock('../../firebase', () => ({ db: {} }));

const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn((field, dir) => ({ field, dir }));
const mockGetDocs = jest.fn();
const mockOnSnapshot = jest.fn();
const mockDoc = jest.fn((db, col, id) => ({ col, id }));
const mockUpdateDoc = jest.fn();
const mockIncrement = jest.fn((n) => ({ __op: 'increment', n }));
const mockLimit = jest.fn((n) => ({ __op: 'limit', n }));

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  getDocs: (...args) => mockGetDocs(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  doc: (...args) => mockDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  increment: (...args) => mockIncrement(...args),
  limit: (...args) => mockLimit(...args),
}));

describe('services/leaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    const cb = jest.fn();
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
    expect(mockIncrement).toHaveBeenCalledWith(3);
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
  });

  test('addPinga throws on invalid delta', async () => {
    const { addPinga } = await import('../leaderboard');
    await expect(addPinga('team1', 0)).rejects.toThrow('Delta must be an integer between 1 and 5');
    await expect(addPinga('team1', 6)).rejects.toThrow('Delta must be an integer between 1 and 5');
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
