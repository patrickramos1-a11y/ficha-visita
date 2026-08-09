import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAtendimento } from '@/contexts/AtendimentoContext';

interface AcompanhamentoStepperProps {
  steps: string[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function AcompanhamentoStepper({ steps, currentStep, onStepChange }: AcompanhamentoStepperProps) {
  const navigate = useNavigate();
  const { data } = useAtendimento();
  const completeSteps = [
    data.fotos.some((foto) => foto.tipo === 'inicial'),
    Boolean(data.responsavel_id),
    ...steps.map((_, index) => index < currentStep - 2),
  ];

  return (
    <div className="border-b border-border bg-card px-4 py-3">
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((completeSteps.filter(Boolean).length + 1) / steps.length) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {steps.map((label, index) => {
          const isCurrent = index === currentStep;
          const isDone = completeSteps[index] && !isCurrent;
          return <button key={label} type="button" onClick={() => index === 0 ? navigate('/visita/foto-inicial') : index === 1 ? navigate('/visita/responsavel') : onStepChange(index)} className="flex min-w-10 shrink-0 flex-col items-center rounded-md p-1" aria-label={`Ir para etapa ${index + 1}: ${label}`}>
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-medium', isDone || isCurrent ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground')}>
              {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className={cn('mt-1 max-w-14 text-center text-[9px] leading-tight', isCurrent ? 'font-medium text-primary' : 'text-muted-foreground')}>{label}</span>
          </button>;
        })}
      </div>
    </div>
  );
}
