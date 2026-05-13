import Dexie, { Table } from 'dexie';
import { AtendimentoData } from '@/types/atendimento';

export type PendingStatus = 'pending' | 'syncing' | 'failed';

export interface PendingAtendimento {
  localId: string;
  data: AtendimentoData; // serializable; dates are stored as ISO strings via Dexie
  status: PendingStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingCliente {
  localId: string; // UUID — also used as cliente_id when synced
  nome: string;
  status: PendingStatus;
  attempts: number;
  lastError?: string;
  createdAt: string;
}

export interface CacheRow<T = any> {
  key: string; // table name
  payload: T;
  updatedAt: string;
}

export interface PhotoBlob {
  fotoId: string;
  blob: Blob;
  mimeType: string;
  tipo: 'inicial' | 'durante' | 'final';
  createdAt: string;
}

class OfflineDB extends Dexie {
  pendingAtendimentos!: Table<PendingAtendimento, string>;
  pendingClientes!: Table<PendingCliente, string>;
  masterCache!: Table<CacheRow, string>;
  photos!: Table<PhotoBlob, string>;

  constructor() {
    super('ficha-visita-offline');
    this.version(1).stores({
      pendingAtendimentos: 'localId, status, createdAt',
      pendingClientes: 'localId, status, createdAt',
      masterCache: 'key',
    });
    this.version(2).stores({
      pendingAtendimentos: 'localId, status, createdAt',
      pendingClientes: 'localId, status, createdAt',
      masterCache: 'key',
      photos: 'fotoId, tipo, createdAt',
    });
  }
}

export const offlineDB = new OfflineDB();

// ----- Photo blobs -----

export async function savePhotoBlob(
  source: Blob | File,
  tipo: 'inicial' | 'durante' | 'final',
): Promise<{ fotoId: string; objectUrl: string }> {
  const fotoId = crypto.randomUUID();
  const mimeType = source.type || 'image/jpeg';
  await offlineDB.photos.add({
    fotoId,
    blob: source,
    mimeType,
    tipo,
    createdAt: new Date().toISOString(),
  });
  const objectUrl = URL.createObjectURL(source);
  return { fotoId, objectUrl };
}

export async function getPhotoBlob(fotoId: string): Promise<PhotoBlob | undefined> {
  return offlineDB.photos.get(fotoId);
}

export async function getPhotoObjectURL(fotoId: string): Promise<string | null> {
  const row = await offlineDB.photos.get(fotoId);
  if (!row) return null;
  return URL.createObjectURL(row.blob);
}

export async function deletePhoto(fotoId: string): Promise<void> {
  await offlineDB.photos.delete(fotoId);
}

export async function listAllPhotoIds(): Promise<string[]> {
  return offlineDB.photos.toCollection().primaryKeys() as Promise<string[]>;
}

/**
 * Remove photos in IndexedDB that are not referenced by any pending atendimento
 * nor by the photo-id list passed in (active session).
 */
export async function cleanupOrphanPhotos(activeFotoIds: string[] = []): Promise<number> {
  const allIds = await listAllPhotoIds();
  if (allIds.length === 0) return 0;

  const pending = await offlineDB.pendingAtendimentos.toArray();
  const referenced = new Set<string>(activeFotoIds);
  for (const p of pending) {
    for (const f of p.data.fotos ?? []) {
      if ((f as any).fotoId) referenced.add((f as any).fotoId);
    }
  }

  const orphans = allIds.filter((id) => !referenced.has(id));
  if (orphans.length === 0) return 0;
  await offlineDB.photos.bulkDelete(orphans);
  return orphans.length;
}

// ----- Pending atendimentos -----

export async function enqueueAtendimento(data: AtendimentoData): Promise<string> {
  const localId = crypto.randomUUID();
  const now = new Date().toISOString();
  // Serialize: dates → ISO; drop transient blob URLs but keep fotoId for sync
  const serialized: AtendimentoData = {
    ...data,
    data_inicio: (data.data_inicio instanceof Date
      ? data.data_inicio.toISOString()
      : data.data_inicio) as unknown as Date,
    data_fim: (data.data_fim instanceof Date
      ? data.data_fim.toISOString()
      : data.data_fim) as unknown as Date,
    fotos: data.fotos.map((f: any) => ({
      fotoId: f.fotoId,
      tipo: f.tipo,
      // Keep legacy url only if it's a data: URL or remote http (not blob:)
      url:
        typeof f.url === 'string' && (f.url.startsWith('data:') || f.url.startsWith('http'))
          ? f.url
          : undefined,
      remoteUrl: f.remoteUrl,
    })) as any,
  };

  await offlineDB.pendingAtendimentos.add({
    localId,
    data: serialized,
    status: 'pending',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  });
  return localId;
}

export async function listPendingAtendimentos() {
  return offlineDB.pendingAtendimentos.orderBy('createdAt').toArray();
}

export async function countPending() {
  const [a, c] = await Promise.all([
    offlineDB.pendingAtendimentos.count(),
    offlineDB.pendingClientes.count(),
  ]);
  return a + c;
}

export async function setAtendimentoStatus(
  localId: string,
  status: PendingStatus,
  error?: string,
) {
  const now = new Date().toISOString();
  const existing = await offlineDB.pendingAtendimentos.get(localId);
  if (!existing) return;
  await offlineDB.pendingAtendimentos.update(localId, {
    status,
    lastError: error,
    attempts: status === 'failed' ? existing.attempts + 1 : existing.attempts,
    updatedAt: now,
  });
}

export async function updateAtendimentoData(localId: string, data: AtendimentoData) {
  await offlineDB.pendingAtendimentos.update(localId, {
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeAtendimento(localId: string) {
  await offlineDB.pendingAtendimentos.delete(localId);
}

// ----- Pending clientes -----

export async function enqueueCliente(nome: string): Promise<PendingCliente> {
  const localId = crypto.randomUUID();
  const row: PendingCliente = {
    localId,
    nome,
    status: 'pending',
    attempts: 0,
    createdAt: new Date().toISOString(),
  };
  await offlineDB.pendingClientes.add(row);
  return row;
}

export async function listPendingClientes() {
  return offlineDB.pendingClientes.orderBy('createdAt').toArray();
}

export async function setClienteStatus(
  localId: string,
  status: PendingStatus,
  error?: string,
) {
  const existing = await offlineDB.pendingClientes.get(localId);
  if (!existing) return;
  await offlineDB.pendingClientes.update(localId, {
    status,
    lastError: error,
    attempts: status === 'failed' ? existing.attempts + 1 : existing.attempts,
  });
}

export async function removeCliente(localId: string) {
  await offlineDB.pendingClientes.delete(localId);
}

// ----- Master cache -----

export async function setCache<T>(key: string, payload: T) {
  await offlineDB.masterCache.put({
    key,
    payload,
    updatedAt: new Date().toISOString(),
  });
}

export async function getCache<T>(key: string): Promise<T | null> {
  const row = await offlineDB.masterCache.get(key);
  return (row?.payload as T) ?? null;
}
