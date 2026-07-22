vi.mock('../../firebase', () => ({ db: {} }));

const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockOrderBy = vi.fn((field, dir) => ({ field, dir }));
const mockOnSnapshot = vi.fn();
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockDoc = vi.fn((db, col, id) => ({ col, id }));
const mockDeleteDoc = vi.fn();
const mockUpdateDoc = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  orderBy: (...args) => mockOrderBy(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  getDocs: (...args) => mockGetDocs(...args),
  addDoc: (...args) => mockAddDoc(...args),
  doc: (...args) => mockDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
}));

describe('services/teams', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('observeTeamsOrderedByName passes mapped teams', async () => {
    const { observeTeamsOrderedByName } = await import('../teams');
    let internalCb;
    mockOnSnapshot.mockImplementation((q, cb) => {
      internalCb = cb;
      return () => 'unsub';
    });
    const cb = vi.fn();
    const unsub = observeTeamsOrderedByName(cb);
    expect(typeof unsub).toBe('function');
    internalCb({ docs: [{ id: '1', data: () => ({ name: 'N', pingas: 0 }) }] });
    expect(cb).toHaveBeenCalledWith([{ id: '1', name: 'N', pingas: 0 }]);
  });

  test('createTeamIfNotExists adds when not present', async () => {
    const { createTeamIfNotExists } = await import('../teams');
    mockGetDocs.mockResolvedValue({ docs: [] });
    await createTeamIfNotExists('New Team');
    expect(mockAddDoc).toHaveBeenCalledWith(undefined, {
      name: 'New Team',
      pingas: 0,
      drinkTotals: {},
    });
  });

  test('createTeamIfNotExists rejects names that differ only by letter case', async () => {
    const { createTeamIfNotExists } = await import('../teams');
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'existing', data: () => ({ name: 'Equipa Pinga' }) }],
    });
    await expect(createTeamIfNotExists(' equipa pinga ')).rejects.toThrow('Team already exists');
  });

  test('updateTeamName validates, excludes the current team, and updates only the name', async () => {
    const { updateTeamName } = await import('../teams');
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'tid', data: () => ({ name: 'Equipa Antiga' }) }],
    });

    await updateTeamName('tid', ' Equipa Nova ');

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      { col: 'teams', id: 'tid' },
      { name: 'Equipa Nova' }
    );
  });

  test('updateTeamName rejects an empty or duplicate name', async () => {
    const { updateTeamName } = await import('../teams');
    await expect(updateTeamName('tid', '   ')).rejects.toThrow('Name is required');

    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'other', data: () => ({ name: 'Equipa Pinga' }) }],
    });
    await expect(updateTeamName('tid', 'equipa pinga')).rejects.toThrow('Team already exists');
  });

  test('deleteTeam deletes by id', async () => {
    const { deleteTeam } = await import('../teams');
    await deleteTeam('tid');
    expect(mockDoc).toHaveBeenCalledWith({}, 'teams', 'tid');
    expect(mockDeleteDoc).toHaveBeenCalled();
  });
});
