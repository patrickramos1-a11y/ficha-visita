import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import type { VisitaModo } from '@/types/atendimento';

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
      case 'radar':
        return data.demandas.some((demanda) => demanda.descricao.trim()) || (data.anotacoes_itens ?? []).some((item) => item.texto.trim());
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
  { id: 'tipos', label: 'Tipos', route: '/visita/tipos' },
  { id: 'acoes', label: 'Ações', route: '/visita/acoes' },
  { id: 'demandas', label: 'Radar', route: '/visita/demandas' },
  { id: 'clientes', label: 'Clientes', route: '/visita/clientes' },
  { id: 'foto-final', label: 'Final', route: '/visita/foto-final' },
];

export const VISIT_STEPS_RAPIDA = [
  { id: 'foto-inicial', label: 'Foto', route: '/visita/foto-inicial' },
  { id: 'responsavel', label: 'Técnico', route: '/visita/responsavel' },
  { id: 'tipos', label: 'Tipos', route: '/visita/rapida/tipos' },
  { id: 'clientes', label: 'Clientes', route: '/visita/rapida/clientes' },
  { id: 'radar', label: 'Radar', route: '/visita/rapida/radar' },
  { id: 'foto-final', label: 'Final', route: '/visita/resumo' },
];

export function getVisitStepsForMode(modo: VisitaModo): Step[] {
  if (modo === 'obras') return [
    { id: 'foto-inicial', label: 'Foto', route: '/visita/foto-inicial' }, { id: 'responsavel', label: 'Técnico', route: '/visita/responsavel' },
    { id: 'obra-identificacao', label: 'Identificação', route: '/visita/obras' }, { id: 'obra-situacao', label: 'Situação', route: '/visita/obras' }, { id: 'obra-ambiente', label: 'Ambiente', route: '/visita/obras' }, { id: 'obra-seguranca', label: 'Segurança', route: '/visita/obras' }, { id: 'obra-residuos', label: 'Resíduos', route: '/visita/obras' }, { id: 'obra-pendencias', label: 'Pendências', route: '/visita/obras' }, { id: 'obra-registro', label: 'Registro', route: '/visita/obras' }, { id: 'radar', label: 'Radar', route: '/visita/obras' }, { id: 'obra-final', label: 'Final', route: '/visita/obras' },
  ];
  if (modo === 'ambiental') return [
    { id: 'foto-inicial', label: 'Foto', route: '/visita/foto-inicial' }, { id: 'responsavel', label: 'Técnico', route: '/visita/responsavel' },
    { id: 'ambiental-identificacao', label: 'Identificação', route: '/visita/ambiental' }, { id: 'ambiental-gestao', label: 'Gestão', route: '/visita/ambiental' }, { id: 'ambiental-ete', label: 'ETE/água', route: '/visita/ambiental' }, { id: 'ambiental-operacao', label: 'Operação', route: '/visita/ambiental' }, { id: 'ambiental-pendencias', label: 'Pendências', route: '/visita/ambiental' }, { id: 'ambiental-registro', label: 'Registro', route: '/visita/ambiental' }, { id: 'radar', label: 'Radar', route: '/visita/ambiental' }, { id: 'ambiental-final', label: 'Final', route: '/visita/ambiental' },
  ];
  if (modo === 'processos') return [
    { id: 'foto-inicial', label: 'Foto', route: '/visita/foto-inicial' }, { id: 'responsavel', label: 'Técnico', route: '/visita/responsavel' },
    { id: 'processos-identificacao', label: 'Identificação', route: '/visita/processos' }, { id: 'processos-cadastro', label: 'Processos', route: '/visita/processos' }, { id: 'processos-registro', label: 'Registro', route: '/visita/processos' }, { id: 'radar', label: 'Radar', route: '/visita/processos' }, { id: 'processos-final', label: 'Final', route: '/visita/processos' },
  ];
  return modo === 'rapida' ? VISIT_STEPS_RAPIDA : VISIT_STEPS;
}
