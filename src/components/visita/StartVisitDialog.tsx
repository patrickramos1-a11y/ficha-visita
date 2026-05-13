import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { ClipboardList, Zap, ChevronRight } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StartVisitDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { iniciarVisita } = useAtendimento();

  const start = (modo: 'completa' | 'rapida') => {
    iniciarVisita(modo);
    onOpenChange(false);
    navigate(modo === 'completa' ? '/visita/foto-inicial' : '/visita/rapida/tipos');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Como será essa visita?</DialogTitle>
          <DialogDescription>
            Escolha o tipo de visita conforme a situação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => start('completa')}
            className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Visita Completa</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fluxo completo com checklist, anotações, tipos, ações, demandas e fotos.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => start('rapida')}
            className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Visita Rápida</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para registros pontuais (15–20 min) sem contato direto. Apenas tipos, cliente, técnico e fotos.
                </p>
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
