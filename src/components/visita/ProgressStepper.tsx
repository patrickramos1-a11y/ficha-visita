import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CancelarVisitaButton } from './CancelarVisitaButton';

interface Step {
  id: string;
  label: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  showCancel?: boolean;
}

export function ProgressStepper({ steps, currentStep, showCancel = true }: ProgressStepperProps) {
  const progress = ((currentStep) / (steps.length - 1)) * 100;

  return (
    <div className="bg-card border-b border-border px-4 py-3">
      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators - simplified for mobile */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                index < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <span className="text-[10px]">{index + 1}</span>
              )}
            </div>
            {/* Only show label for current step on small screens */}
            <span className={cn(
              "text-[9px] mt-1 max-w-[40px] text-center leading-tight",
              index === currentStep 
                ? 'text-primary font-medium' 
                : 'text-muted-foreground hidden sm:block'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const VISIT_STEPS = [
  { id: 'foto-inicial', label: 'Foto' },
  { id: 'responsavel', label: 'Técnico' },
  { id: 'anotacoes', label: 'Notas' },
  { id: 'tipos', label: 'Tipos' },
  { id: 'acoes', label: 'Ações' },
  { id: 'demandas', label: 'Demandas' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'foto-final', label: 'Final' },
];
