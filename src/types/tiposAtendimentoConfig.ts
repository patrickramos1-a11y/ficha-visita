import { PlanoTipo } from './atendimento';
import { getTiposCache, getAcoesCache } from '@/lib/tiposAcoesCache';

export interface TipoAtendimentoConfig {
  nome: string;
  descricao: string;
  plano: PlanoTipo;
}

export interface AcaoEspecificaConfig {
  nome: string;
  plano: PlanoTipo;
}

/**
 * @deprecated Tipos e Ações agora são gerenciados em Configurações.
 * Use os hooks `useTiposAtendimentoConfig` / `useAcoesEspecificasConfig`.
 * Este export retorna o cache local mais recente para uso síncrono
 * (ex: PDF, sync engine offline).
 */
export const TIPOS_ATENDIMENTO_CONFIG: TipoAtendimentoConfig[] = new Proxy([], {
  get(_t, prop) {
    const list = getTiposCache();
    return (list as any)[prop as any];
  },
}) as any;

export const ACOES_ESPECIFICAS_CONFIG: AcaoEspecificaConfig[] = new Proxy([], {
  get(_t, prop) {
    const list = getAcoesCache();
    return (list as any)[prop as any];
  },
}) as any;

export function getPlanoFromTipo(tipo: string): PlanoTipo | undefined {
  return getTiposCache().find(t => t.nome === tipo)?.plano;
}

export function getPlanoFromAcao(acao: string): PlanoTipo {
  return getAcoesCache().find(a => a.nome === acao)?.plano || 'VIP';
}
