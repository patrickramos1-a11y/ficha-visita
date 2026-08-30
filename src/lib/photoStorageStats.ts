type PhotoKind = 'inicial' | 'durante' | 'final' | string;

export interface PhotoStorageRow {
  id?: string;
  tipo?: PhotoKind | null;
  metadata_compressao?: Record<string, unknown> | null;
}

export interface PhotoStorageStats {
  totalPhotos: number;
  photosWithMetadata: number;
  knownBytes: number;
  averageBytes: number;
  largestBytes: number;
  averageSavingsPercent: number;
  byType: Record<string, number>;
  estimates: { photos: number; bytes: number }[];
}

const ESTIMATE_VOLUMES = [1000, 5000, 10000];

export function calculatePhotoStorageStats(rows: PhotoStorageRow[]): PhotoStorageStats {
  const sizes = rows
    .map((row) => Number(row.metadata_compressao?.tamanho_final_bytes ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const savings = rows
    .map((row) => Number(row.metadata_compressao?.economia_percentual ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);
  const knownBytes = sizes.reduce((total, value) => total + value, 0);
  const averageBytes = sizes.length ? Math.round(knownBytes / sizes.length) : 0;

  return {
    totalPhotos: rows.length,
    photosWithMetadata: sizes.length,
    knownBytes,
    averageBytes,
    largestBytes: sizes.length ? Math.max(...sizes) : 0,
    averageSavingsPercent: savings.length
      ? Math.round(savings.reduce((total, value) => total + value, 0) / savings.length)
      : 0,
    byType: rows.reduce<Record<string, number>>((acc, row) => {
      const tipo = row.tipo || 'sem tipo';
      acc[tipo] = (acc[tipo] ?? 0) + 1;
      return acc;
    }, {}),
    estimates: ESTIMATE_VOLUMES.map((photos) => ({
      photos,
      bytes: averageBytes * photos,
    })),
  };
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}
