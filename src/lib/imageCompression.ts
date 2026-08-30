const TARGET_BYTES = 900 * 1024;
const STANDARD_MAX_SIDE = 1280;
const STANDARD_QUALITY = 0.7;
const FALLBACK_QUALITY = 0.62;
const FALLBACK_MAX_SIDE = 1100;
const TECHNICAL_MAX_SIDE = 1600;
const TECHNICAL_QUALITY = 0.75;
const TECHNICAL_FALLBACK_QUALITY = 0.68;
const TECHNICAL_FALLBACK_MAX_SIDE = 1400;
const TECHNICAL_TARGET_BYTES = 1400 * 1024;

export interface PhotoCompressionMetadata {
  tamanho_original_bytes: number;
  tamanho_final_bytes: number;
  largura_original: number;
  altura_original: number;
  largura_final: number;
  altura_final: number;
  qualidade_usada: number | null;
  maior_lado_aplicado: number | null;
  detalhe_tecnico: boolean;
  economia_percentual: number;
  regra:
    | 'original_preservado'
    | 'padrao'
    | 'padrao_recomprimido'
    | 'padrao_reduzido'
    | 'detalhe_tecnico'
    | 'detalhe_tecnico_recomprimido'
    | 'detalhe_tecnico_reduzido'
    | 'sem_compressao';
}

export interface CompressedVisitPhoto {
  blob: Blob;
  metadata: PhotoCompressionMetadata;
}

export interface CompressVisitPhotoOptions {
  detalheTecnico?: boolean;
}

/**
 * Produces a report-friendly image before it is kept offline or sent to Storage.
 * The limit preserves enough detail for technical evidence while reducing upload
 * time and database/storage consumption on mobile networks.
 */
export async function compressVisitPhoto(
  source: Blob,
  options: CompressVisitPhotoOptions = {},
): Promise<CompressedVisitPhoto> {
  const detalheTecnico = Boolean(options.detalheTecnico);

  if (!source.type.startsWith('image/') || source.type === 'image/gif') {
    return {
      blob: source,
      metadata: buildMetadata(source, source, null, null, detalheTecnico, 'sem_compressao'),
    };
  }

  const imageUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(imageUrl);
    const originalDimensions = {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    };

    const attempts = detalheTecnico
      ? [
          { maxSide: TECHNICAL_MAX_SIDE, quality: TECHNICAL_QUALITY, rule: 'detalhe_tecnico' as const, targetBytes: TECHNICAL_TARGET_BYTES },
          { maxSide: TECHNICAL_MAX_SIDE, quality: TECHNICAL_FALLBACK_QUALITY, rule: 'detalhe_tecnico_recomprimido' as const, targetBytes: TECHNICAL_TARGET_BYTES },
          { maxSide: TECHNICAL_FALLBACK_MAX_SIDE, quality: TECHNICAL_FALLBACK_QUALITY, rule: 'detalhe_tecnico_reduzido' as const, targetBytes: TECHNICAL_TARGET_BYTES },
        ]
      : [
          { maxSide: STANDARD_MAX_SIDE, quality: STANDARD_QUALITY, rule: 'padrao' as const, targetBytes: TARGET_BYTES },
          { maxSide: STANDARD_MAX_SIDE, quality: FALLBACK_QUALITY, rule: 'padrao_recomprimido' as const, targetBytes: TARGET_BYTES },
          { maxSide: FALLBACK_MAX_SIDE, quality: FALLBACK_QUALITY, rule: 'padrao_reduzido' as const, targetBytes: TARGET_BYTES },
        ];

    let best: { blob: Blob; width: number; height: number; maxSide: number; quality: number; rule: PhotoCompressionMetadata['regra'] } | null = null;

    for (const attempt of attempts) {
      const resized = await renderImage(image, attempt.maxSide, attempt.quality);
      best = { ...resized, maxSide: attempt.maxSide, quality: attempt.quality, rule: attempt.rule };
      if (resized.blob.size <= attempt.targetBytes) break;
    }

    if (!best) {
      return {
        blob: source,
        metadata: buildMetadata(source, source, originalDimensions.width, originalDimensions.height, detalheTecnico, 'sem_compressao'),
      };
    }

    const shouldKeepOriginal = source.size <= TARGET_BYTES && source.size < best.blob.size;
    if (shouldKeepOriginal) {
      return {
        blob: source,
        metadata: buildMetadata(
          source,
          source,
          originalDimensions.width,
          originalDimensions.height,
          detalheTecnico,
          'original_preservado',
        ),
      };
    }

    return {
      blob: best.blob,
      metadata: {
        tamanho_original_bytes: source.size,
        tamanho_final_bytes: best.blob.size,
        largura_original: originalDimensions.width,
        altura_original: originalDimensions.height,
        largura_final: best.width,
        altura_final: best.height,
        qualidade_usada: best.quality,
        maior_lado_aplicado: best.maxSide,
        detalhe_tecnico: detalheTecnico,
        economia_percentual: calculateSavings(source.size, best.blob.size),
        regra: best.rule,
      },
    };
  } catch {
    // A photo must never block a visit because one browser cannot decode it.
    return {
      blob: source,
      metadata: buildMetadata(source, source, null, null, detalheTecnico, 'sem_compressao'),
    };
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

async function renderImage(image: HTMLImageElement, maxSide: number, quality: number) {
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, maxSide / Math.max(originalWidth, originalHeight));
  const width = Math.max(1, Math.round(originalWidth * scale));
  const height = Math.max(1, Math.round(originalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to draw image');

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  return { blob, width, height };
}

function buildMetadata(
  source: Blob,
  finalBlob: Blob,
  width: number | null,
  height: number | null,
  detalheTecnico: boolean,
  regra: PhotoCompressionMetadata['regra'],
): PhotoCompressionMetadata {
  return {
    tamanho_original_bytes: source.size,
    tamanho_final_bytes: finalBlob.size,
    largura_original: width ?? 0,
    altura_original: height ?? 0,
    largura_final: width ?? 0,
    altura_final: height ?? 0,
    qualidade_usada: null,
    maior_lado_aplicado: null,
    detalhe_tecnico: detalheTecnico,
    economia_percentual: calculateSavings(source.size, finalBlob.size),
    regra,
  };
}

function calculateSavings(originalBytes: number, finalBytes: number) {
  if (!originalBytes) return 0;
  return Math.max(0, Math.round((1 - finalBytes / originalBytes) * 100));
}
