const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.75;

/**
 * Produces a report-friendly image before it is kept offline or sent to Storage.
 * The limit preserves enough detail for technical evidence while reducing upload
 * time and database/storage consumption on mobile networks.
 */
export async function compressVisitPhoto(source: Blob): Promise<Blob> {
  if (!source.type.startsWith('image/') || source.type === 'image/gif') return source;

  const imageUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(imageUrl);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return source;

    context.drawImage(image, 0, 0, width, height);
    const compressed = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);

    // Keep an already small image when JPEG conversion would increase its size.
    return compressed.size < source.size ? compressed : source;
  } catch {
    // A photo must never block a visit because one browser cannot decode it.
    return source;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to compress image'));
    }, type, quality);
  });
}
