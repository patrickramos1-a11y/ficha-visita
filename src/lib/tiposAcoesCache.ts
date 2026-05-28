import { PlanoTipo } from '@/types/atendimento';

interface TipoCache { nome: string; descricao: string; plano: PlanoTipo; topico?: string | null; subtopico?: string | null }
interface AcaoCache { nome: string; plano: PlanoTipo; topico?: string | null; subtopico?: string | null }

const TIPOS_KEY = 'cache_tipos_atendimento_v2';
const ACOES_KEY = 'cache_acoes_especificas_v2';

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

export function getTopicoSubtopicoFromTipo(nome: string): { topico?: string | null; subtopico?: string | null } {
  const t = getTiposCache().find(x => x.nome === nome);
  return { topico: t?.topico, subtopico: t?.subtopico };
}

export function getTopicoSubtopicoFromAcao(nome: string): { topico?: string | null; subtopico?: string | null } {
  const a = getAcoesCache().find(x => x.nome === nome);
  return { topico: a?.topico, subtopico: a?.subtopico };
}
