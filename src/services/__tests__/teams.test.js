jest.mock('../../firebase', () => ({ db: {} }));

const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn((field, dir) => ({ field, dir }));
const mockOnSnapshot = jest.fn();
const mockWhere = jest.fn();
const mockGetDocs = jest.fn();
const mockAddDoc = jest.fn();
const mockDoc = jest.fn((db, col, id) => ({ col, id }));
const mockDeleteDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  where: (...args) => mockWhere(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  doc: (...args) => mockDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
}));

describe('services/teams', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('observeTeamsOrderedByName passes mapped teams', async () => {
    const { observeTeamsOrderedByName } = await import('../teams');
    let internalCb;
    mockOnSnapshot.mockImplementation((q, cb) => {
      internalCb = cb;
      return () => 'unsub';
    });
    const cb = jest.fn();
    const unsub = observeTeamsOrderedByName(cb);
    expect(typeof unsub).toBe('function');
    internalCb({ docs: [{ id: '1', data: () => ({ name: 'N', pingas: 0 }) }] });
    expect(cb).toHaveBeenCalledWith([{ id: '1', name: 'N', pingas: 0 }]);
  });

  test('createTeamIfNotExists adds when not present', async () => {
    const { createTeamIfNotExists } = await import('../teams');
    mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
    await createTeamIfNotExists('New Team');
    expect(mockAddDoc).toHaveBeenCalled();
  });

  test('createTeamIfNotExists throws when already exists', async () => {
    const { createTeamIfNotExists } = await import('../teams');
    mockGetDocs.mockResolvedValue({ empty: false, docs: [{}] });
    await expect(createTeamIfNotExists('Existing')).rejects.toThrow('Team already exists');
  });

  test('deleteTeam deletes by id', async () => {
    const { deleteTeam } = await import('../teams');
    await deleteTeam('tid');
    expect(mockDoc).toHaveBeenCalledWith({}, 'teams', 'tid');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});
