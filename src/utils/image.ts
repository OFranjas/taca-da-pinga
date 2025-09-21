const MAX_DATA_URL_LENGTH = 180000;
const JPEG_MIME = 'image/jpeg';
const PNG_MIME = 'image/png';
const WEBP_MIME = 'image/webp';

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

type ImageFormat = 'png' | 'jpeg' | 'webp';

function encodeCanvas(canvas: HTMLCanvasElement, format: ImageFormat, quality?: number): string {
  const mime = format === 'png' ? PNG_MIME : format === 'webp' ? WEBP_MIME : JPEG_MIME;
  const constrainedQuality = quality != null ? Math.max(Math.min(quality, 1), 0.1) : undefined;
  let dataUrl: string;
  try {
    if (format === 'png') {
      dataUrl = canvas.toDataURL(mime);
    } else {
      dataUrl = canvas.toDataURL(mime, constrainedQuality);
    }
  } catch (error) {
    if (format === 'webp') {
      return '';
    }
    throw error;
  }
  if (!dataUrl.startsWith('data:image')) {
    throw new Error('Failed to encode image');
  }
  return dataUrl;
}

function canvasHasTransparency(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return false;
  }
  const { width, height } = canvas;
  if (!width || !height) {
    return false;
  }
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      return true;
    }
  }
  return false;
}

function withBackground(canvas: HTMLCanvasElement, color: string): HTMLCanvasElement {
  const next = document.createElement('canvas');
  next.width = canvas.width;
  next.height = canvas.height;
  const ctx = next.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, next.width, next.height);
  ctx.drawImage(canvas, 0, 0);
  return next;
}

function scaleCanvas(canvas: HTMLCanvasElement, factor: number): HTMLCanvasElement {
  const next = document.createElement('canvas');
  const width = Math.max(1, Math.round(canvas.width * factor));
  const height = Math.max(1, Math.round(canvas.height * factor));
  next.width = width;
  next.height = height;
  const ctx = next.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }
  ctx.drawImage(canvas, 0, 0, width, height);
  return next;
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
  const hasTransparency = canvasHasTransparency(canvas);
  const prefersPng = hasTransparency || /image\/(png|webp|svg\+xml)/i.test(file.type);

  if (prefersPng) {
    const webpQualities = [quality, 0.82, 0.7]
      .filter((val): val is number => typeof val === 'number')
      .filter((val, idx, arr) => arr.indexOf(val) === idx);
    for (const q of webpQualities) {
      const webpOutput = encodeCanvas(canvas, 'webp', q);
      if (
        webpOutput &&
        webpOutput.startsWith('data:image/webp') &&
        webpOutput.length <= MAX_DATA_URL_LENGTH
      ) {
        return webpOutput;
      }
    }

    let scaledCanvas: HTMLCanvasElement = canvas;
    let pngOutput = encodeCanvas(scaledCanvas, 'png');
    while (
      pngOutput.length > MAX_DATA_URL_LENGTH &&
      scaledCanvas.width > 64 &&
      scaledCanvas.height > 64
    ) {
      scaledCanvas = scaleCanvas(scaledCanvas, 0.85);
      pngOutput = encodeCanvas(scaledCanvas, 'png');
    }
    if (pngOutput.length <= MAX_DATA_URL_LENGTH) {
      return pngOutput;
    }
  }

  const baseCanvas = hasTransparency ? withBackground(canvas, '#ffffff') : canvas;

  const jpegQualities = [quality, 0.6, 0.5]
    .filter((val): val is number => typeof val === 'number')
    .filter((val, idx, arr) => arr.indexOf(val) === idx);
  for (const q of jpegQualities) {
    const jpegOutput = encodeCanvas(baseCanvas, 'jpeg', q);
    if (jpegOutput.length <= MAX_DATA_URL_LENGTH) {
      return jpegOutput;
    }
  }

  throw new Error('Unable to compress image below 180k characters');
}

export { MAX_DATA_URL_LENGTH };
