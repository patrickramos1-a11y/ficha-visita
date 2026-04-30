import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CancelarVisitaButtonProps {
  className?: string;
}

export function CancelarVisitaButton({ className }: CancelarVisitaButtonProps) {
  const navigate = useNavigate();
  const { resetAtendimento } = useAtendimento();
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    resetAtendimento();
    setOpen(false);
    toast.success('Visita cancelada');
    navigate('/');
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
          'text-xs font-medium text-destructive',
          'bg-destructive/10 hover:bg-destructive/20',
          'transition-colors haptic-press touch-safe',
          className
        )}
        aria-label="Cancelar visita"
      >
        <X className="w-3.5 h-3.5" />
        Cancelar visita
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar a visita?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados preenchidos até agora (fotos, anotações, demandas, etc.) serão perdidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar visita</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
