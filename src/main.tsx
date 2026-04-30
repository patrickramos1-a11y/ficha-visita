import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// PWA Service Worker — registrar APENAS em produção real (não em iframe/preview do Lovable)
const isInIframe = (() => {
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

if (isInIframe || isPreviewHost) {
  // Garantir que nenhum SW antigo fique servindo cache stale dentro do preview
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else {
  // Produção: registrar o SW gerado pelo vite-plugin-pwa
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // ignora — PWA é progressive enhancement
    });
}

createRoot(document.getElementById("root")!).render(<App />);
