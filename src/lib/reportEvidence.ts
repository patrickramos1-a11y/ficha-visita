export type ReportPhotoEvidence = {
  id: string;
  foto_url: string;
  tipo: 'inicial' | 'durante' | 'final';
  atendimento_personalizado_modulo_id?: string | null;
  atendimento_personalizado_item_id?: string | null;
  atendimento_personalizado_item_ids?: string[] | null;
};

export type ReportEvidenceGroup<T extends ReportPhotoEvidence = ReportPhotoEvidence> = {
  code: string;
  fingerprint: string;
  photo: T;
  photoIds: string[];
  itemIds: string[];
  moduleIds: string[];
  types: T['tipo'][];
  duplicateCount: number;
};

export function groupReportEvidence<T extends ReportPhotoEvidence>(
  photos: T[],
  fingerprints: Record<string, string> = {},
): ReportEvidenceGroup<T>[] {
  const groups = new Map<string, Omit<ReportEvidenceGroup<T>, 'code'>>();

  for (const photo of photos) {
    const fingerprint = fingerprints[photo.id] || `url:${photo.foto_url}`;
    const itemIds = [
      ...(photo.atendimento_personalizado_item_ids ?? []),
      photo.atendimento_personalizado_item_id,
    ].filter(Boolean) as string[];
    const moduleIds = [photo.atendimento_personalizado_modulo_id].filter(Boolean) as string[];
    const current = groups.get(fingerprint);

    if (!current) {
      groups.set(fingerprint, {
        fingerprint,
        photo,
        photoIds: [photo.id],
        itemIds: [...new Set(itemIds)],
        moduleIds: [...new Set(moduleIds)],
        types: [photo.tipo],
        duplicateCount: 1,
      });
      continue;
    }

    current.photoIds.push(photo.id);
    current.itemIds = [...new Set([...current.itemIds, ...itemIds])];
    current.moduleIds = [...new Set([...current.moduleIds, ...moduleIds])];
    current.types = [...new Set([...current.types, photo.tipo])];
    current.duplicateCount += 1;
  }

  return [...groups.values()].map((group, index) => ({
    ...group,
    code: `EV-${String(index + 1).padStart(2, '0')}`,
  }));
}
