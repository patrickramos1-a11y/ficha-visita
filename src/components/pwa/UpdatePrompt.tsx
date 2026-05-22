import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { applyUpdate, onUpdateAvailable } from "@/lib/pwaUpdater";
import { Loader2 } from "lucide-react";

export function UpdatePrompt() {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    return onUpdateAvailable(() => setOpen(true));
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await applyUpdate();
    } catch {
      setUpdating(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => !updating && setOpen(v)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nova versão disponível</AlertDialogTitle>
          <AlertDialogDescription>
            Uma atualização do aplicativo está pronta. Deseja atualizar agora?
            O app será recarregado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updating}>Agora não</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={updating}>
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              "Atualizar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
