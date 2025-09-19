const originalFileReader = global.FileReader;
const OriginalImage = global.Image as typeof Image | undefined;
const originalCreateElement = document.createElement;

let toDataURLMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  class StubFileReader {
    public result: string | ArrayBuffer | null = null;
    public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
    public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

    readAsDataURL() {
      this.result = 'data:image/png;base64,AAA';
      if (this.onload) {
        this.onload.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
      }
    }
  }

  global.FileReader = StubFileReader as unknown as typeof FileReader;

  class StubImage {
    public width = 800;
    public height = 600;
    public onload: (() => void) | null = null;
    public onerror: (() => void) | null = null;

    set src(_value: string) {
      queueMicrotask(() => {
        this.onload?.();
      });
    }
  }

  // @ts-expect-error - overriding for test
  global.Image = StubImage;

  toDataURLMock = vi.fn();
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toDataURL: toDataURLMock,
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalFileReader) {
    global.FileReader = originalFileReader;
  } else {
    // @ts-expect-error - removing test stub when FileReader was undefined
    delete global.FileReader;
  }

  if (OriginalImage) {
    // @ts-expect-error - restoring for test environment
    global.Image = OriginalImage;
  } else {
    // @ts-expect-error - removing stub
    delete global.Image;
  }
});

describe('compressImage', () => {
  test('returns data URL within limit on first attempt', async () => {
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(1000));
    const { compressImage } = await import('../image');
    const result = await compressImage({} as File);
    expect(result.startsWith('data:image/jpeg')).toBe(true);
    expect(toDataURLMock).toHaveBeenCalledTimes(1);
  });

  test('retries at lower quality when above size cap', async () => {
    toDataURLMock
      .mockReturnValueOnce('data:image/jpeg;base64,' + 'a'.repeat(200000))
      .mockReturnValueOnce('data:image/jpeg;base64,' + 'a'.repeat(1000));
    const { compressImage } = await import('../image');
    const result = await compressImage({} as File, { quality: 0.8 });
    expect(result.length).toBeLessThanOrEqual(180000);
    expect(toDataURLMock).toHaveBeenCalledTimes(2);
  });

  test('throws when image remains above size cap', async () => {
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(200000));
    const { compressImage } = await import('../image');
    await expect(compressImage({} as File)).rejects.toThrow(
      'Unable to compress image below 180k characters'
    );
    expect(toDataURLMock).toHaveBeenCalledTimes(2);
  });

  test('throws when initial quality already at fallback and too large', async () => {
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(200000));
    const { compressImage } = await import('../image');
    await expect(compressImage({} as File, { quality: 0.6 })).rejects.toThrow(
      'Unable to compress image below 180k characters'
    );
    expect(toDataURLMock).toHaveBeenCalledTimes(1);
  });
});
