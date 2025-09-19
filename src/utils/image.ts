const MAX_DATA_URL_LENGTH = 180000;
const JPEG_MIME = 'image/jpeg';

export interface CompressImageOptions {
  maxW?: number;
  maxH?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  maxW: 600,
  maxH: 600,
  quality: 0.7,
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Failed to read image file'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

function computeTargetSize(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const { width, height } = img;
  if (!width || !height) {
    throw new Error('Image has invalid dimensions');
  }
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(1, widthRatio, heightRatio);
  const targetWidth = Math.round(width * ratio);
  const targetHeight = Math.round(height * ratio);
  return {
    width: targetWidth || width,
    height: targetHeight || height,
  };
}

function encodeCanvas(canvas: HTMLCanvasElement, quality: number): string {
  const nextQuality = Math.max(Math.min(quality, 1), 0.1);
  const dataUrl = canvas.toDataURL(JPEG_MIME, nextQuality);
  if (!dataUrl.startsWith('data:image')) {
    throw new Error('Failed to encode image');
  }
  return dataUrl;
}

async function drawToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const { maxW, maxH, quality } = { ...DEFAULT_OPTIONS, ...options };
  const originalDataUrl = await readFileAsDataURL(file);
  const imageElement = await loadImageElement(originalDataUrl);
  const { width, height } = computeTargetSize(imageElement, maxW, maxH);
  const canvas = await drawToCanvas(imageElement, width, height);

  const primaryQuality = quality;
  const primaryOutput = encodeCanvas(canvas, primaryQuality);
  if (primaryOutput.length <= MAX_DATA_URL_LENGTH) {
    return primaryOutput;
  }

  const fallbackQuality = 0.6;
  if (Math.abs(primaryQuality - fallbackQuality) < 0.0001) {
    throw new Error('Unable to compress image below 180k characters');
  }

  const fallbackOutput = encodeCanvas(canvas, fallbackQuality);
  if (fallbackOutput.length <= MAX_DATA_URL_LENGTH) {
    return fallbackOutput;
  }

  throw new Error('Unable to compress image below 180k characters');
}

export { MAX_DATA_URL_LENGTH };
