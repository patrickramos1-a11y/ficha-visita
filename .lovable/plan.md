# Atualização automática do PWA

Hoje o PWA usa `registerType: "autoUpdate"` no `vite.config.ts` e `registerSW({ immediate: true })` no `src/main.tsx`. Isso baixa o novo service worker em background, mas **não ativa** a nova versão até o usuário fechar todas as abas/instâncias — por isso o app instalado parece "preso" em uma versão antiga.

A solução é trocar o registro silencioso por um fluxo que:
1. Detecta quando há uma nova versão pronta.
2. Pergunta ao usuário se quer atualizar agora.
3. Ao aceitar, ativa o novo SW e recarrega.
4. Verifica novas versões automaticamente ao abrir o app e a cada X minutos.
5. Oferece um botão "Buscar atualizações" nas Configurações.

## O que será feito

### 1. Novo módulo `src/lib/pwaUpdater.ts`
- Encapsula `registerSW` do `virtual:pwa-register` expondo:
  - `initPwaUpdater()` — registra o SW, agenda verificação periódica (a cada 30 min) e checa imediatamente na abertura.
  - `checkForUpdate()` — força uma verificação manual (usada pelo botão).
  - `applyUpdate()` — chama `updateSW(true)` para ativar a nova versão e recarregar.
  - Event emitter simples (`onUpdateAvailable`, `onUpdateChecked`) para a UI reagir.
- Mantém o guard atual de iframe/preview host (não roda no preview do Lovable).

### 2. Atualizar `src/main.tsx`
- Substituir a importação inline por `initPwaUpdater()` do novo módulo. Nenhuma mudança de comportamento no preview.

### 3. Novo componente `src/components/pwa/UpdatePrompt.tsx`
- Escuta `onUpdateAvailable` e mostra um **AlertDialog** centralizado:
  - Título: "Nova versão disponível"
  - Texto: "Uma atualização do aplicativo está pronta. Deseja atualizar agora?"
  - Botões: "Agora não" / "Atualizar"
- "Atualizar" chama `applyUpdate()` → o SW assume controle e a página recarrega automaticamente.
- "Agora não" fecha o diálogo; o prompt reaparece na próxima verificação ou ao reabrir o app.
- Montado uma única vez no `App.tsx`, ao lado do `InstallPromptBanner`.

### 4. Botão manual em `src/pages/desktop/Configuracoes.tsx`
- Nova aba **"Aplicativo"** (ou seção fixa no topo das configurações) com:
  - Versão atual exibida (lida de um `APP_VERSION` exportado, vindo de `package.json` via `import.meta.env`).
  - Botão **"Buscar atualizações"** que chama `checkForUpdate()`.
  - Feedback via toast:
    - Se houver update → dispara o mesmo AlertDialog do prompt automático.
    - Se já estiver atualizado → toast "Você já está na versão mais recente".
    - Se offline → toast "Sem conexão para verificar atualizações".
- Como as configurações são desktop, também adicionar o mesmo botão num bloco discreto acessível no mobile (na tela inicial ou num menu "Sobre") — confirmar comportamento abaixo.

### 5. Manifest / versão
- Expor `APP_VERSION` lendo `package.json.version` via `define` no `vite.config.ts` para mostrar nas Configurações. Sem mudar o manifest.

## Detalhes técnicos

```ts
// src/lib/pwaUpdater.ts (resumo)
import { registerSW } from "virtual:pwa-register";

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = { available: new Set<() => void>(), checked: new Set<(hasUpdate: boolean) => void>() };

export function initPwaUpdater() {
  if (isPreviewOrIframe()) return;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { listeners.available.forEach(fn => fn()); },
    onRegisteredSW(_swUrl, registration) {
      // Checa a cada 30 min
      setInterval(() => registration?.update(), 30 * 60 * 1000);
    },
  });
}

export async function checkForUpdate() {
  const reg = await navigator.serviceWorker?.getRegistration();
  await reg?.update();
  // onNeedRefresh dispara se houver atualização; aqui apenas avisamos os listeners.
}

export async function applyUpdate() {
  await updateSW?.(true); // true = recarrega a página após ativar
}
```

- `onNeedRefresh` é o callback oficial do `vite-plugin-pwa` que dispara quando o novo SW está em `waiting`.
- `registration.update()` força o browser a buscar o SW novo; se houver mudança, `onNeedRefresh` é chamado.
- `updateSW(true)` envia `SKIP_WAITING` ao SW e recarrega a página.

Nenhuma mudança no `vite.config.ts` além de `define: { __APP_VERSION__: JSON.stringify(pkg.version) }`.

## Confirmação rápida

Quero confirmar dois pontos antes de implementar — se você não responder, sigo com os defaults marcados:

1. **Onde colocar o botão "Buscar atualizações" no mobile?**
   - (default) Pequeno bloco no rodapé da tela inicial mostrando versão + botão.
   - Ou: nova entrada no menu inferior / página "Sobre".
2. **Intervalo de checagem automática em background:** default 30 minutos. OK?

Sem nenhuma resposta, sigo com os defaults.
