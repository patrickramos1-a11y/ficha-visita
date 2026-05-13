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

class OfflineDB extends Dexie {
  pendingAtendimentos!: Table<PendingAtendimento, string>;
  pendingClientes!: Table<PendingCliente, string>;
  masterCache!: Table<CacheRow, string>;

  constructor() {
    super('ficha-visita-offline');
    this.version(1).stores({
      pendingAtendimentos: 'localId, status, createdAt',
      pendingClientes: 'localId, status, createdAt',
      masterCache: 'key',
    });
  }
}

export const offlineDB = new OfflineDB();

// ----- Pending atendimentos -----

export async function enqueueAtendimento(data: AtendimentoData): Promise<string> {
  const localId = crypto.randomUUID();
  const now = new Date().toISOString();
  // Serialize dates so Dexie stores plain values
  const serialized = {
    ...data,
    data_inicio: data.data_inicio instanceof Date ? data.data_inicio.toISOString() : data.data_inicio,
    data_fim: data.data_fim instanceof Date ? data.data_fim.toISOString() : data.data_fim,
  } as unknown as AtendimentoData;

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
