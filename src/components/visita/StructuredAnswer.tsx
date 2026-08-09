import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import type { SimNaoParcialNA } from '@/types/atendimento';

const ANSWERS: { value: SimNaoParcialNA; label: string; className: string }[] = [
  {
    value: 'SIM',
    label: 'Conforme',
    className: 'data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:border-emerald-600',
  },
  {
    value: 'PARCIALMENTE',
    label: 'Parcial',
    className: 'data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:border-amber-500',
  },
  {
    value: 'NAO',
    label: 'Não conforme',
    className: 'data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:border-red-600',
  },
  {
    value: 'NAO_SE_APLICA',
    label: 'N/A',
    className: 'data-[state=on]:bg-slate-500 data-[state=on]:text-white data-[state=on]:border-slate-500',
  },
];

interface StructuredAnswerProps {
  value: SimNaoParcialNA;
  onChange: (value: SimNaoParcialNA) => void;
}

export function StructuredAnswer({ value, onChange }: StructuredAnswerProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => next && onChange(next as SimNaoParcialNA)}
      className="grid grid-cols-4 gap-1.5"
    >
      {ANSWERS.map((answer) => (
        <ToggleGroupItem
          key={answer.value}
          value={answer.value}
          aria-label={answer.label}
          className={cn(
            'h-10 min-w-0 rounded-md border px-1.5 text-[11px] leading-tight text-muted-foreground',
            'data-[state=on]:shadow-sm',
            answer.className,
          )}
        >
          {answer.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function structuredAnswerLabel(value?: SimNaoParcialNA) {
  return ANSWERS.find((answer) => answer.value === value)?.label ?? 'Não informado';
}
