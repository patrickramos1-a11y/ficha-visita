import { cn } from '@/lib/utils';
import type { SimNaoParcialNA } from '@/types/atendimento';

const ANSWERS: { value: SimNaoParcialNA; label: string; className: string }[] = [
  {
    value: 'SIM',
    label: 'Conforme',
    className: 'bg-emerald-600 text-white border-emerald-600',
  },
  {
    value: 'PARCIALMENTE',
    label: 'Parcial',
    className: 'bg-amber-500 text-white border-amber-500',
  },
  {
    value: 'NAO',
    label: 'Não conforme',
    className: 'bg-red-600 text-white border-red-600',
  },
  {
    value: 'NAO_SE_APLICA',
    label: 'N/A',
    className: 'bg-slate-500 text-white border-slate-500',
  },
];

interface StructuredAnswerProps {
  value: SimNaoParcialNA;
  onChange: (value: SimNaoParcialNA) => void;
}

export function StructuredAnswer({ value, onChange }: StructuredAnswerProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5" role="radiogroup">
      {ANSWERS.map((answer) => (
        <button
          key={answer.value}
          type="button"
          role="radio"
          aria-checked={value === answer.value}
          aria-label={answer.label}
          onClick={() => onChange(answer.value)}
          className={cn(
            'h-10 min-w-0 rounded-md border px-1.5 text-[11px] leading-tight text-muted-foreground',
            value === answer.value && 'shadow-sm',
            value === answer.value && answer.className,
          )}
        >
          {answer.label}
        </button>
      ))}
    </div>
  );
}

export function structuredAnswerLabel(value?: SimNaoParcialNA) {
  return ANSWERS.find((answer) => answer.value === value)?.label ?? 'Não informado';
}
