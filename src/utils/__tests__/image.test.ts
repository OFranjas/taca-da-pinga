import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const domOverrides = globalThis as typeof globalThis & {
  FileReader?: typeof FileReader;
  Image?: typeof Image;
};

const originalFileReader = domOverrides.FileReader;
const OriginalImage = domOverrides.Image;
const originalCreateElement = document.createElement;

type CanvasStubConfig = {
  hasTransparency?: boolean;
  width?: number;
  height?: number;
};

const canvasQueue: CanvasStubConfig[] = [];
const canvasContexts: Array<{
  drawImage: ReturnType<typeof vi.fn>;
  fillRect: ReturnType<typeof vi.fn>;
  getImageData: ReturnType<typeof vi.fn>;
}> = [];

const enqueueCanvasConfig = (config: CanvasStubConfig = {}) => {
  canvasQueue.push(config);
};

const getLastCanvasContext = () => canvasContexts[canvasContexts.length - 1];

let toDataURLMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  canvasQueue.length = 0;
  canvasContexts.length = 0;

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

  domOverrides.FileReader = StubFileReader as unknown as typeof FileReader;

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

  domOverrides.Image = StubImage as unknown as typeof Image;

  toDataURLMock = vi.fn((type?: string) => `data:${type ?? 'image/jpeg'};base64,AAA`);

  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName === 'canvas') {
      const config = canvasQueue.shift() ?? {};
      let width = config.width ?? 400;
      let height = config.height ?? 320;
      const ctx = {
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        getImageData: vi.fn(() => ({
          data: new Uint8ClampedArray(
            config.hasTransparency ? [0, 0, 0, 120] : [255, 255, 255, 255]
          ),
        })),
      };
      canvasContexts.push(ctx);
      return {
        getContext: (contextId: string) => (contextId && contextId.startsWith('2d') ? ctx : null),
        toDataURL: toDataURLMock,
        get width() {
          return width;
        },
        set width(value: number) {
          width = value;
        },
        get height() {
          return height;
        },
        set height(value: number) {
          height = value;
        },
      } as unknown as HTMLCanvasElement;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalFileReader) {
    domOverrides.FileReader = originalFileReader;
  } else {
    Reflect.deleteProperty(domOverrides, 'FileReader');
  }

  if (OriginalImage) {
    domOverrides.Image = OriginalImage;
  } else {
    Reflect.deleteProperty(domOverrides, 'Image');
  }
});

describe('compressImage', () => {
  test('returns data URL within limit on first attempt', async () => {
    enqueueCanvasConfig({ hasTransparency: false });
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(1000));
    const { compressImage } = await import('../image');
    const result = await compressImage({} as File);
    expect(result.startsWith('data:image/jpeg')).toBe(true);
    expect(toDataURLMock).toHaveBeenCalledTimes(1);
  });

  test('retries at lower quality when above size cap', async () => {
    enqueueCanvasConfig({ hasTransparency: false });
    toDataURLMock
      .mockReturnValueOnce('data:image/jpeg;base64,' + 'a'.repeat(200000))
      .mockReturnValueOnce('data:image/jpeg;base64,' + 'a'.repeat(1000));
    const { compressImage } = await import('../image');
    const result = await compressImage({} as File, { quality: 0.8 });
    expect(result.length).toBeLessThanOrEqual(180000);
    expect(toDataURLMock).toHaveBeenCalledTimes(2);
  });

  test('throws when image remains above size cap', async () => {
    enqueueCanvasConfig({ hasTransparency: false });
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(200000));
    const { compressImage } = await import('../image');
    await expect(compressImage({} as File)).rejects.toThrow(
      'Unable to compress image below 180k characters'
    );
    expect(toDataURLMock).toHaveBeenCalledTimes(3);
  });

  test('throws when initial quality already at fallback and too large', async () => {
    enqueueCanvasConfig({ hasTransparency: false });
    toDataURLMock.mockReturnValue('data:image/jpeg;base64,' + 'a'.repeat(200000));
    const { compressImage } = await import('../image');
    await expect(compressImage({} as File, { quality: 0.6 })).rejects.toThrow(
      'Unable to compress image below 180k characters'
    );
    expect(toDataURLMock).toHaveBeenCalledTimes(2);
  });

  test('prefers webp for transparent assets when within size limit', async () => {
    enqueueCanvasConfig({ hasTransparency: true });
    toDataURLMock.mockImplementation((type?: string) => {
      if (type === 'image/webp') {
        return 'data:image/webp;base64,' + 'a'.repeat(1000);
      }
      if (type === 'image/png') {
        return 'data:image/png;base64,' + 'a'.repeat(200000);
      }
      return 'data:image/jpeg;base64,' + 'a'.repeat(1500);
    });

    const { compressImage } = await import('../image');
    const result = await compressImage({ type: 'image/png' } as File);
    expect(result.startsWith('data:image/webp')).toBe(true);
  });

  test('scales transparent png until size fits within limit', async () => {
    enqueueCanvasConfig({ hasTransparency: true, width: 400, height: 320 });
    enqueueCanvasConfig({ hasTransparency: true, width: 340, height: 272 });
    enqueueCanvasConfig({ hasTransparency: true, width: 290, height: 232 });
    let pngCalls = 0;
    toDataURLMock.mockImplementation((type?: string) => {
      if (type === 'image/webp') {
        return 'data:image/webp;base64,' + 'a'.repeat(220000);
      }
      if (type === 'image/png') {
        pngCalls += 1;
        return pngCalls < 3
          ? 'data:image/png;base64,' + 'a'.repeat(210000)
          : 'data:image/png;base64,' + 'a'.repeat(120000);
      }
      return 'data:image/jpeg;base64,' + 'a'.repeat(1500);
    });

    const { compressImage } = await import('../image');
    const result = await compressImage({ type: 'image/png' } as File);
    expect(result.startsWith('data:image/png')).toBe(true);
    expect(pngCalls).toBeGreaterThanOrEqual(3);
  });

  test('falls back to jpeg with white background when transparency remains too large', async () => {
    enqueueCanvasConfig({ hasTransparency: true });
    enqueueCanvasConfig({ hasTransparency: false });

    toDataURLMock.mockImplementation((type?: string) => {
      if (type === 'image/webp' || type === 'image/png') {
        return 'data:' + (type ?? 'image/png') + ';base64,' + 'a'.repeat(220000);
      }
      return 'data:image/jpeg;base64,' + 'a'.repeat(120000);
    });

    const { compressImage } = await import('../image');
    const result = await compressImage({ type: 'image/png' } as File, { quality: 0.85 });
    expect(result.startsWith('data:image/jpeg')).toBe(true);
    const backgroundCtx = getLastCanvasContext();
    expect(backgroundCtx?.fillRect).toHaveBeenCalled();
  });
});

export { enqueueCanvasConfig };
