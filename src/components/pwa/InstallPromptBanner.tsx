import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari não dispara beforeinstallprompt — mostrar instrução manual
    if (isIOS()) {
      setShowIosHint(true);
      setVisible(true);
    }

    const installedHandler = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // ignore
    } finally {
      sessionStorage.setItem(DISMISS_KEY, "1");
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60]",
        "safe-bottom safe-x px-4 pb-3 pt-3",
        "pointer-events-none"
      )}
      role="region"
      aria-label="Instalar aplicativo"
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-md",
          "rounded-xl border border-border bg-card shadow-lg",
          "p-4 flex flex-col gap-3"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 text-sm text-foreground">
            {showIosHint && !deferredPrompt ? (
              <>
                <p className="font-medium">Instale o app na tela de início</p>
                <p className="mt-1 text-muted-foreground inline-flex items-center gap-1 flex-wrap">
                  Toque em <Share className="inline h-4 w-4" /> Compartilhar e
                  depois em "Adicionar à Tela de Início" para acessar suas
                  fichas mesmo sem internet.
                </p>
              </>
            ) : (
              <p>
                Instale o app para acessar suas fichas a qualquer momento,
                mesmo sem internet.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground transition-colors p-1 -m-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            Agora não
          </Button>
          {deferredPrompt && (
            <Button size="sm" onClick={install}>
              <Download className="h-4 w-4" />
              Instalar agora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
