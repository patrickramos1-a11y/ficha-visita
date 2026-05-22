// PWA update orchestration.
// Wraps vite-plugin-pwa's registerSW to expose a friendly API for
// detecting, prompting and applying updates.

type AvailableListener = () => void;
type CheckedListener = (hasUpdate: boolean) => void;

let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | null = null;
let updateAvailable = false;

const availableListeners = new Set<AvailableListener>();
const checkedListeners = new Set<CheckedListener>();

function isPreviewOrIframe(): boolean {
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";
  return inIframe || isPreviewHost;
}

export function isPwaEnabled(): boolean {
  return !isPreviewOrIframe() && "serviceWorker" in navigator;
}

export function initPwaUpdater() {
  if (isPreviewOrIframe()) {
    // Garante que SW antigo não persista no preview
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
    return;
  }

  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          updateAvailable = true;
          availableListeners.forEach((fn) => fn());
        },
        onRegisteredSW(_swUrl, reg) {
          registration = reg ?? null;
          // Verifica a cada 30 min
          if (reg) {
            setInterval(() => {
              reg.update().catch(() => {});
            }, 30 * 60 * 1000);
          }
        },
      });
    })
    .catch(() => {
      // PWA é progressive enhancement
    });
}

export async function checkForUpdate(): Promise<{ hasUpdate: boolean }> {
  if (!isPwaEnabled()) {
    return { hasUpdate: false };
  }
  try {
    const reg =
      registration ??
      (await navigator.serviceWorker.getRegistration()) ??
      null;
    if (reg) {
      registration = reg;
      await reg.update();
    }
  } catch {
    // ignora
  }
  // pequena espera para onNeedRefresh disparar caso haja nova versão
  await new Promise((r) => setTimeout(r, 800));
  const hasUpdate = updateAvailable;
  checkedListeners.forEach((fn) => fn(hasUpdate));
  return { hasUpdate };
}

export async function applyUpdate(): Promise<void> {
  if (updateSW) {
    await updateSW(true);
  } else {
    window.location.reload();
  }
}

export function onUpdateAvailable(fn: AvailableListener): () => void {
  availableListeners.add(fn);
  // dispara imediatamente caso já esteja disponível
  if (updateAvailable) fn();
  return () => availableListeners.delete(fn);
}

export function onUpdateChecked(fn: CheckedListener): () => void {
  checkedListeners.add(fn);
  return () => checkedListeners.delete(fn);
}

export const APP_VERSION: string =
  ((globalThis as any).__APP_VERSION__ as string) ?? "dev";
