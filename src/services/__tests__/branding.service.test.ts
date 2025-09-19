vi.mock('../../firebase', () => ({ db: {} }));

const mockDoc = vi.fn(() => ({}));
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockServerTimestamp = vi.fn(() => 'server-ts');

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

const compressImage = vi.fn();
vi.mock('../../utils/image', () => ({
  compressImage: (...args: unknown[]) => compressImage(...args),
}));

describe('branding.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('getBranding returns empty object when doc missing', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const { getBranding } = await import('../branding.service');
    const data = await getBranding();
    expect(data).toEqual({});
    expect(mockDoc).toHaveBeenCalledWith({}, 'branding', 'current');
  });

  test('getBranding returns stored data', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ mainLogoDataUrl: 'logo', iconDataUrl: 'icon', extra: 'x' }),
    });
    const { getBranding } = await import('../branding.service');
    const data = await getBranding();
    expect(data).toEqual({ mainLogoDataUrl: 'logo', iconDataUrl: 'icon' });
  });

  test('updateBranding compresses provided files and merges doc', async () => {
    compressImage.mockResolvedValueOnce('compressed-main');
    compressImage.mockResolvedValueOnce('compressed-icon');
    const { updateBranding } = await import('../branding.service');
    const mainFile = { name: 'main.png' } as unknown as File;
    const iconFile = { name: 'icon.png' } as unknown as File;

    await updateBranding({ mainLogoFile: mainFile, iconFile });

    expect(compressImage).toHaveBeenNthCalledWith(1, mainFile);
    expect(compressImage).toHaveBeenNthCalledWith(2, iconFile);
    expect(mockSetDoc).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        mainLogoDataUrl: 'compressed-main',
        iconDataUrl: 'compressed-icon',
        updatedAt: 'server-ts',
      }),
      { merge: true }
    );
  });

  test('updateBranding updates only timestamp when no files', async () => {
    const { updateBranding } = await import('../branding.service');
    await updateBranding({});
    expect(compressImage).not.toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledWith({}, { updatedAt: 'server-ts' }, { merge: true });
  });
});
