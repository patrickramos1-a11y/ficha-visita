import { PlanoTipo } from '@/types/atendimento';

interface TipoCache { nome: string; descricao: string; plano: PlanoTipo }
interface AcaoCache { nome: string; plano: PlanoTipo }

const TIPOS_KEY = 'cache_tipos_atendimento_v1';
const ACOES_KEY = 'cache_acoes_especificas_v1';

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getTiposCache(): TipoCache[] {
  return read<TipoCache>(TIPOS_KEY);
}

export function getAcoesCache(): AcaoCache[] {
  return read<AcaoCache>(ACOES_KEY);
}

export function setTiposCache(items: TipoCache[]) {
  try { localStorage.setItem(TIPOS_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

export function setAcoesCache(items: AcaoCache[]) {
  try { localStorage.setItem(ACOES_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}
