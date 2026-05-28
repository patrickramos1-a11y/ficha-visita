// PWA update orchestration.
// Compara a versão instalada com /version.json publicado e força recarga limpa
// quando há atualização, evitando precisar desinstalar/reinstalar o app.

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

export const APP_VERSION: string =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? "dev";

export function initPwaUpdater() {
  if (isPreviewOrIframe()) {
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

async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export async function checkForUpdate(): Promise<{ hasUpdate: boolean }> {
  if (!isPwaEnabled()) {
    return { hasUpdate: false };
  }

  const remoteVersion = await fetchRemoteVersion();
  const hasUpdate =
    !!remoteVersion && remoteVersion !== "dev" && remoteVersion !== APP_VERSION;

  // Em paralelo, pede ao SW para checar nova versão (pode disparar onNeedRefresh)
  try {
    const reg =
      registration ?? (await navigator.serviceWorker.getRegistration()) ?? null;
    if (reg) {
      registration = reg;
      await reg.update().catch(() => {});
    }
  } catch {
    // ignora
  }

  if (hasUpdate) updateAvailable = true;
  checkedListeners.forEach((fn) => fn(hasUpdate || updateAvailable));
  return { hasUpdate: hasUpdate || updateAvailable };
}

async function clearAllCachesAndUnregister(): Promise<void> {
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    // ignora
  }
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // ignora
  }
}

export async function applyUpdate(): Promise<void> {
  // 1. Tenta promover SW em waiting
  try {
    const reg =
      registration ?? (await navigator.serviceWorker.getRegistration()) ?? null;
    if (reg) {
      await reg.update().catch(() => {});
      const waiting = reg.waiting;
      if (waiting) {
        waiting.postMessage({ type: "SKIP_WAITING" });
        // dá um instante para o controllerchange
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  } catch {
    // ignora
  }

  // 2. Limpeza forçada — garante que da próxima vez o navegador busque tudo de novo
  await clearAllCachesAndUnregister();

  // 3. Reload bypass cache
  const url = new URL(window.location.href);
  url.searchParams.set("u", Date.now().toString());
  window.location.replace(url.toString());
}

export function onUpdateAvailable(fn: AvailableListener): () => void {
  availableListeners.add(fn);
  if (updateAvailable) fn();
  return () => availableListeners.delete(fn);
}

export function onUpdateChecked(fn: CheckedListener): () => void {
  checkedListeners.add(fn);
  return () => checkedListeners.delete(fn);
}
