import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../firebase', () => ({ db: {} }));

const mockCollection = vi.fn(() => ({}));
const mockQuery = vi.fn(() => ({}));
const mockOrderBy = vi.fn((field: string, dir: string) => ({ field, dir }));
const mockGetDocs = vi.fn();
const mockAddDoc = vi.fn();
const mockDoc = vi.fn(() => ({}));
const mockUpdateDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockLimit = vi.fn(() => ({}));
const mockOnSnapshot = vi.fn();
const batchUpdate = vi.fn();
const batchCommit = vi.fn();
const mockWriteBatch = vi.fn(() => ({ update: batchUpdate, commit: batchCommit }));
const mockServerTimestamp = vi.fn(() => 'server-ts');
const mockWhere = vi.fn((field: string, op: string, value: unknown) => ({
  field,
  op,
  value,
}));

vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  query: mockQuery,
  orderBy: mockOrderBy,
  getDocs: mockGetDocs,
  addDoc: mockAddDoc,
  doc: mockDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  limit: mockLimit,
  onSnapshot: mockOnSnapshot,
  writeBatch: mockWriteBatch,
  serverTimestamp: mockServerTimestamp,
  where: mockWhere,
}));

const compressImage = vi.fn();
vi.mock('../../utils/image', () => ({
  compressImage,
}));

describe('sponsors.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchUpdate.mockReset();
    batchCommit.mockReset();
  });

  test('listSponsors returns mapped docs ordered by order asc', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        { id: 'a', data: () => ({ order: 0, name: 'A', active: true }) },
        { id: 'b', data: () => ({ order: 1, name: 'B', active: false }) },
      ],
    });
    const { listSponsors } = await import('../sponsors.service');
    const sponsors = await listSponsors();
    expect(mockQuery).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ field: 'order', dir: 'asc' })
    );
    expect(mockOrderBy).toHaveBeenCalledWith('order', 'asc');
    expect(sponsors).toEqual([
      { id: 'a', order: 0, name: 'A', active: true },
      { id: 'b', order: 1, name: 'B', active: false },
    ]);
  });

  test('listSponsors with activeOnly queries only active sponsors', async () => {
    mockGetDocs.mockResolvedValue({
      docs: [{ id: 'a', data: () => ({ order: 0, name: 'A', active: true }) }],
    });
    const { listSponsors } = await import('../sponsors.service');
    const sponsors = await listSponsors({ activeOnly: true });
    expect(mockQuery).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ field: 'active', op: '==', value: true }),
      expect.objectContaining({ field: 'order', dir: 'asc' })
    );
    expect(mockWhere).toHaveBeenCalledWith('active', '==', true);
    expect(sponsors).toEqual([{ id: 'a', order: 0, name: 'A', active: true }]);
  });

  test('observeSponsors with activeOnly queries only active sponsors', async () => {
    mockOnSnapshot.mockImplementation((_query, callback) => {
      callback({
        docs: [{ id: 'a', data: () => ({ order: 0, name: 'A', active: true }) }],
      });
      return vi.fn();
    });

    const { observeSponsors } = await import('../sponsors.service');
    const callback = vi.fn();
    observeSponsors(callback, { activeOnly: true });

    expect(mockQuery).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ field: 'active', op: '==', value: true }),
      expect.objectContaining({ field: 'order', dir: 'asc' })
    );
    expect(callback).toHaveBeenCalledWith([{ id: 'a', order: 0, name: 'A', active: true }]);
  });

  test('createSponsor compresses image, assigns order and timestamps', async () => {
    compressImage.mockResolvedValue('compressed-image');
    mockGetDocs.mockResolvedValueOnce({ empty: true, docs: [] });
    mockAddDoc.mockResolvedValue({ id: 'new-id' });

    const { createSponsor } = await import('../sponsors.service');
    const file = { name: 'img.png' } as unknown as File;

    const id = await createSponsor({ name: 'Sponsor', imageFile: file });

    expect(id).toBe('new-id');
    expect(compressImage).toHaveBeenCalledWith(file);
    expect(mockAddDoc).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'Sponsor',
        link: '',
        imageDataUrl: 'compressed-image',
        active: true,
        order: 0,
        createdAt: 'server-ts',
        updatedAt: 'server-ts',
      })
    );
  });

  test('normalizes optional HTTPS sponsor links and rejects unsafe URLs', async () => {
    const { normalizeSponsorLink } = await import('../sponsors.service');

    expect(normalizeSponsorLink(' https://example.com/sponsor ')).toBe(
      'https://example.com/sponsor'
    );
    expect(normalizeSponsorLink('')).toBe('');
    expect(() => normalizeSponsorLink('http://example.com')).toThrow('URL HTTPS válido');
    expect(() => normalizeSponsorLink('not a URL')).toThrow('URL HTTPS válido');
  });

  test('createSponsor throws when max order reached', async () => {
    mockGetDocs.mockResolvedValueOnce({
      empty: false,
      docs: [{ data: () => ({ order: 999 }) }],
    });
    const { createSponsor } = await import('../sponsors.service');
    await expect(
      createSponsor({ name: 'Overflow', imageFile: { name: 'x.png' } as unknown as File })
    ).rejects.toThrow('Maximum sponsor order reached');
  });

  test('updateSponsor merges provided fields and compresses new image', async () => {
    compressImage.mockResolvedValue('new-img');
    const { updateSponsor } = await import('../sponsors.service');
    const file = { name: 'img.png' } as unknown as File;

    await updateSponsor('id-1', {
      name: 'Updated',
      link: 'https://link',
      imageFile: file,
      active: false,
    });

    expect(compressImage).toHaveBeenCalledWith(file);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        name: 'Updated',
        link: 'https://link/',
        imageDataUrl: 'new-img',
        active: false,
        updatedAt: 'server-ts',
      })
    );
  });

  test('deleteSponsor removes document', async () => {
    const { deleteSponsor } = await import('../sponsors.service');
    await deleteSponsor('id-2');
    expect(mockDeleteDoc).toHaveBeenCalledWith({});
  });

  test('reorderSponsors updates batch with sequential order', async () => {
    const { reorderSponsors } = await import('../sponsors.service');
    batchUpdate.mockImplementation(() => {});
    batchCommit.mockResolvedValue(undefined);

    await reorderSponsors(['a', 'b', 'c']);

    expect(mockWriteBatch).toHaveBeenCalledWith({});
    expect(batchUpdate).toHaveBeenNthCalledWith(1, {}, { order: 0 });
    expect(batchUpdate).toHaveBeenNthCalledWith(2, {}, { order: 1 });
    expect(batchUpdate).toHaveBeenNthCalledWith(3, {}, { order: 2 });
    expect(batchCommit).toHaveBeenCalled();
  });

  test('reorderSponsors throws when more than 1000 sponsors', async () => {
    const { reorderSponsors } = await import('../sponsors.service');
    const ids = Array.from({ length: 1001 }, (_, i) => `id-${i}`);
    await expect(reorderSponsors(ids)).rejects.toThrow('Too many sponsors to reorder');
    expect(batchCommit).not.toHaveBeenCalled();
  });
});
