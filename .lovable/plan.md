## Problema

O botão "Buscar atualizações" sempre informa "Você já está na versão mais recente", obrigando o usuário a apagar e reinstalar o app. Causas:

1. `APP_VERSION` aparece como "dev" porque o `define` do Vite (`__APP_VERSION__`) é lido como propriedade `(globalThis as any).__APP_VERSION__` — não é identificador livre, então o Vite não substitui.
2. `checkForUpdate` confia só no evento `onNeedRefresh` do vite-plugin-pwa. Com `autoUpdate` + `immediate: true`, o SW se atualiza sozinho e o evento muitas vezes não dispara, então `updateAvailable` permanece `false`.
3. Não há comparação real entre versão instalada e versão publicada.

## Solução

**1. `vite.config.ts`**
- Calcular `APP_VERSION_STRING` uma vez no topo.
- Trocar `define` para `"import.meta.env.VITE_APP_VERSION"`.
- Adicionar plugin `closeBundle` que escreve `dist/version.json` com `{ "version": "..." }`.

**2. `src/lib/pwaUpdater.ts`**
- `APP_VERSION` passa a vir de `import.meta.env.VITE_APP_VERSION`.
- Novo `checkForUpdate`: faz `fetch("/version.json", { cache: "no-store" })`, compara `version` com `APP_VERSION`. Se diferente → `hasUpdate = true`.
- Quando há update: aciona `reg.update()`, aguarda o novo SW chegar a `installed/waiting`, manda `SKIP_WAITING`, limpa todos os caches do Workbox, desregistra SWs antigos e dá `location.reload()`.
- `applyUpdate` reaproveita o mesmo fluxo de limpeza forçada.

**3. `src/components/pwa/UpdateCheckCard.tsx`**
- Quando `hasUpdate` for true, mostra toast "Nova versão encontrada, atualizando…" e chama `applyUpdate()` direto (sem depender do `UpdatePrompt` global).

Funcionalidade só ativa em app publicado/instalado (`isPwaEnabled()`). Preview continua intacto.
