import { useTiposAtendimentoConfig, useAcoesEspecificasConfig } from '@/hooks/useConfigEntities';

/**
 * Mounted globally to keep the local cache of tipos/ações warm.
 * Sync engine and PDF generator read this cache synchronously.
 */
export function ConfigCachePrefetcher() {
  useTiposAtendimentoConfig();
  useAcoesEspecificasConfig();
  return null;
}
