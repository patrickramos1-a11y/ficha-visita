import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAtendimento } from '@/contexts/AtendimentoContext';

interface Step {
  id: string;
  label: string;
  route?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  showCancel?: boolean;
}

export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  const navigate = useNavigate();
  const { data } = useAtendimento();

  const isStepDone = (stepId: string): boolean => {
    switch (stepId) {
      case 'foto-inicial':
        return data.fotos.some(f => f.tipo === 'inicial');
      case 'responsavel':
        return !!data.responsavel_id;
      case 'anotacoes':
        return (data.anotacoes?.trim().length ?? 0) > 0 || data.checklist.length > 0;
      case 'tipos':
        return data.tipos_atendimento.length > 0;
      case 'acoes':
        return data.acoes_especificas.length > 0;
      case 'demandas':
        return data.demandas.length > 0;
      case 'clientes':
        return data.cliente_ids.length > 0;
      case 'foto-final':
        return data.possui_foto_final;
      default:
        return false;
    }
  };

  const doneCount = steps.filter(s => isStepDone(s.id)).length;
  const progress = (doneCount / steps.length) * 100;

  const handleStepClick = (step: Step, index: number) => {
    if (index === currentStep) return;
    if (step.route) navigate(step.route);
  };

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCurrent = index === currentStep;
          const isDone = isStepDone(step.id) && !isCurrent;
          const clickable = !!step.route && !isCurrent;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => handleStepClick(step, index)}
              disabled={!clickable}
              aria-label={`Ir para etapa ${index + 1}: ${step.label}`}
              className={cn(
                "flex flex-col items-center touch-safe rounded-md p-1 -m-1 transition-opacity",
                clickable ? "cursor-pointer hover:opacity-80 active:opacity-60" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : isCurrent
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/30'
                    : 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="text-[10px]">{index + 1}</span>
                )}
              </div>
              <span className={cn(
                "text-[9px] mt-1 max-w-[40px] text-center leading-tight",
                isCurrent
                  ? 'text-primary font-medium'
                  : isDone
                  ? 'text-foreground'
                  : 'text-muted-foreground/60'
              )}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const VISIT_STEPS = [
  { id: 'foto-inicial', label: 'Foto', route: '/visita/foto-inicial' },
  { id: 'responsavel', label: 'Técnico', route: '/visita/responsavel' },
  { id: 'anotacoes', label: 'Notas', route: '/visita/anotacoes' },
  { id: 'tipos', label: 'Tipos', route: '/visita/tipos' },
  { id: 'acoes', label: 'Ações', route: '/visita/acoes' },
  { id: 'demandas', label: 'Demandas', route: '/visita/demandas' },
  { id: 'clientes', label: 'Clientes', route: '/visita/clientes' },
  { id: 'foto-final', label: 'Final', route: '/visita/foto-final' },
];
