import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { APP_VERSION, applyUpdate, checkForUpdate, isPwaEnabled } from "@/lib/pwaUpdater";

interface Props {
  compact?: boolean;
}

export function UpdateCheckCard({ compact }: Props) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    if (!navigator.onLine) {
      toast.error("Sem conexão para verificar atualizações");
      return;
    }
    if (!isPwaEnabled()) {
      toast.info("Atualizações automáticas só funcionam no app publicado");
      return;
    }
    setChecking(true);
    try {
      const { hasUpdate } = await checkForUpdate();
      if (hasUpdate) {
        toast.success("Nova versão encontrada, atualizando...");
        await applyUpdate();
      } else {
        toast.success("Você já está na versão mais recente");
      }
    } catch {
      toast.error("Não foi possível verificar atualizações");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardContent
        className={
          compact
            ? "p-3 flex items-center justify-between gap-3"
            : "p-4 sm:p-6 flex items-center justify-between gap-4 flex-wrap"
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-tight">Aplicativo</p>
            <p className="text-xs text-muted-foreground truncate">
              Versão {APP_VERSION}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheck}
          disabled={checking}
          className="gap-2"
        >
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {checking ? "Verificando..." : "Buscar atualizações"}
        </Button>
      </CardContent>
    </Card>
  );
}
