## Objetivo

Tornar a plataforma 100% funcional offline, com armazenamento local automático e sincronização transparente para o Supabase assim que a conexão voltar — sem perda de dados e com indicador visual de status.

## Etapas de execução

### Etapa 1 — Infraestrutura de armazenamento local (IndexedDB)

- Adicionar a biblioteca `dexie` (IndexedDB wrapper) para criar um banco local robusto no dispositivo.
- Criar `src/lib/offlineDB.ts` definindo as tabelas locais:
  - `atendimentos_pendentes` (payload completo da visita + status: `pending` | `syncing` | `failed`, tentativas, timestamp)
  - `clientes_pendentes` (novos clientes criados offline)
  - `fotos_pendentes` (blobs das fotos vinculados ao atendimento local por um `localId`)
  - `cache_clientes`, `cache_responsaveis`, `cache_demandas_especificas`, `cache_planos`, `cache_topicos`, `cache_subtopicos` (espelho leve dos dados mestres para uso offline)
- Funções utilitárias: `saveLocal`, `listPending`, `markSyncing`, `markSynced`, `markFailed`, `removeLocal`.

### Etapa 2 — Cache offline dos dados mestres

- Adaptar hooks `useClientes`, `useResponsaveis`, `useConfigEntities` para:
  - Sempre que houver resposta do Supabase, espelhar no cache local (Dexie).
  - Quando offline (ou query falhar), ler do cache local como fallback.
- Garantir que `react-query` use `staleTime` longo e `networkMode: 'offlineFirst'` para não ficar travado em loading sem rede.

### Etapa 3 — Detecção de status de conexão

- Criar `src/hooks/useOnlineStatus.ts` baseado em `navigator.onLine` + listeners `online`/`offline` + ping leve periódico ao Supabase (para detectar “conectado mas sem internet real”).
- Criar `src/contexts/SyncContext.tsx` expondo: `isOnline`, `pendingCount`, `isSyncing`, `lastSyncAt`, `triggerSync()`.

### Etapa 4 — Indicador visual de status

- Componente `src/components/sync/SyncStatusBadge.tsx`:
  - Offline: badge discreto cinza/laranja “Sem conexão — dados salvos no aparelho”.
  - Online sincronizando: badge azul com spinner “Sincronizando X itens…”.
  - Online sem pendências: badge verde sutil “Sincronizado” (some após alguns segundos).
- Inserir no `MobileLayout` (topo, ao lado do header) e no `DesktopLayout` (canto superior direito).
- Toast de sucesso “X visitas enviadas para o servidor” ao concluir sync.

### Etapa 5 — Refatorar `useSaveAtendimento` para offline-first

- Novo fluxo do botão “Finalizar visita”:
  1. Sempre salvar primeiro no Dexie (`atendimentos_pendentes` + `fotos_pendentes` com blobs).
  2. Limpar a sessão da visita (`AtendimentoContext.resetAtendimento`) e ir para a tela de sucesso normalmente.
  3. Disparar `triggerSync()` em background — se online, envia agora; se offline, fica aguardando.
- Cadastro de cliente novo offline (`useCreateCliente`): cria com UUID local (`crypto.randomUUID`), grava em `clientes_pendentes` e já aparece imediatamente na lista. Esse mesmo UUID é usado como `cliente_id` no atendimento, e o Supabase aceitará o id na sincronização.

### Etapa 6 — Motor de sincronização

- `src/lib/syncEngine.ts` com função `runSync()`:
  1. Enviar primeiro `clientes_pendentes` (para que `cliente_id` exista no servidor).
  2. Enviar `atendimentos_pendentes`: `insert` em `atendimentos`, depois `atendimento_clientes`, upload das fotos do Dexie para o bucket `atendimento-fotos`, depois `atendimento_fotos` e `demandas`.
  3. Em sucesso: `removeLocal(localId)` e marcar sincronizado.
  4. Em falha: incrementar `tentativas`, marcar `failed`, manter dados — nunca deletar.
- Disparadores de `runSync()`:
  - Evento `online` do navegador.
  - Ao abrir o app (se houver pendências e estiver online).
  - Após salvar uma nova visita.
  - Retry com backoff exponencial (30s, 1min, 5min, 15min) enquanto houver falha.
- Mutex simples para evitar duas execuções concorrentes.

### Etapa 7 — Resolução de conflitos (last-write-wins)

- Adicionar coluna `client_updated_at TIMESTAMPTZ` em `atendimentos` (timestamp gerado no dispositivo no momento da edição).
- Na sincronização de atualizações: comparar `client_updated_at` local com o do servidor; só sobrescreve se o local for mais recente. Para inserts puros (caso atual), regra não se aplica.
- Migração SQL preparada para adicionar a coluna com default `now()`.

### Etapa 8 — Garantir o app utilizável sem rede (PWA / shell offline)

- O projeto já tem `vite-plugin-pwa` configurado. Ajustar `workbox` para:
  - `NetworkFirst` em navegações HTML (já recomendado).
  - `CacheFirst` para assets estáticos (JS/CSS/fontes/ícones).
  - `StaleWhileRevalidate` para imagens públicas do bucket.
- Garantir que o registro do Service Worker continue desabilitado dentro do iframe de preview (já implementado em `main.tsx`).
- Confirmar que rotas do app continuam navegáveis offline (fallback para `index.html`).

### Etapa 9 — Persistência da sessão da visita em andamento

- Já existe `localStorage` para o `AtendimentoContext`. Migrar progressivamente para Dexie para suportar fotos grandes sem estourar o limite de 5 MB do `localStorage` (blobs vão para IndexedDB; o restante do estado pode continuar em `localStorage` por simplicidade).

### Etapa 10 — Testes manuais e ajustes finais

- Roteiro de QA:
  1. Desligar Wi-Fi/dados → criar 2 visitas + 1 cliente novo + fotos → ver badge offline e tudo salvo.
  2. Religar conexão → ver badge “sincronizando” e toast de sucesso → conferir registros no Supabase → confirmar Dexie limpo.
  3. Forçar erro de rede no meio da sync → conferir que dados continuam no Dexie e nova tentativa acontece sozinha.
  4. Recarregar o app offline → confirmar que abre normalmente (PWA shell + dados em cache).

## Detalhes técnicos resumidos

- Lib local: **Dexie** (IndexedDB) para dados estruturados + blobs de fotos.
- Detecção de rede: `navigator.onLine` + ping leve a `${SUPABASE_URL}/auth/v1/health`.
- Estratégia de conflito: **last-write-wins** por `client_updated_at`.
- Retry: backoff exponencial com mutex.
- Sem mudanças de auth (projeto é multi-cliente público hoje).

## Fora de escopo

- Resolução de conflitos por merge campo a campo (apenas last-write-wins).
- Sincronização bidirecional em tempo real (Supabase Realtime).
- Compressão/redimensionamento adicional de fotos.
