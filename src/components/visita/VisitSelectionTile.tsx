import type { LucideIcon } from 'lucide-react';
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Droplets,
  FileInput,
  FileSearch,
  Handshake,
  Landmark,
  Leaf,
  Recycle,
  ShieldAlert,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TileTone = {
  base: string;
  selected: string;
  icon: string;
};

const TONES: TileTone[] = [
  { base: 'border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:border-emerald-400', selected: 'border-emerald-600 bg-emerald-600 text-white shadow-sm', icon: 'bg-emerald-100 text-emerald-700' },
  { base: 'border-sky-200 bg-sky-50/80 text-sky-950 hover:border-sky-400', selected: 'border-sky-600 bg-sky-600 text-white shadow-sm', icon: 'bg-sky-100 text-sky-700' },
  { base: 'border-amber-200 bg-amber-50/80 text-amber-950 hover:border-amber-400', selected: 'border-amber-500 bg-amber-500 text-white shadow-sm', icon: 'bg-amber-100 text-amber-700' },
  { base: 'border-rose-200 bg-rose-50/80 text-rose-950 hover:border-rose-400', selected: 'border-rose-600 bg-rose-600 text-white shadow-sm', icon: 'bg-rose-100 text-rose-700' },
  { base: 'border-violet-200 bg-violet-50/80 text-violet-950 hover:border-violet-400', selected: 'border-violet-600 bg-violet-600 text-white shadow-sm', icon: 'bg-violet-100 text-violet-700' },
  { base: 'border-teal-200 bg-teal-50/80 text-teal-950 hover:border-teal-400', selected: 'border-teal-600 bg-teal-600 text-white shadow-sm', icon: 'bg-teal-100 text-teal-700' },
];

function hashText(text: string) {
  return Array.from(text).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getTone(label: string) {
  return TONES[hashText(label) % TONES.length];
}

function pickIcon(label: string, kind: 'tipo' | 'acao'): LucideIcon {
  const text = label.toLowerCase();
  if (text.includes('process') || text.includes('protoc') || text.includes('licen') || text.includes('document')) return FileSearch;
  if (text.includes('órg') || text.includes('org') || text.includes('secret') || text.includes('taxa')) return Landmark;
  if (text.includes('obra') || text.includes('canteiro') || text.includes('estrutura') || text.includes('instala')) return Building2;
  if (text.includes('resíduo') || text.includes('residuo') || text.includes('coleta') || text.includes('destina')) return Recycle;
  if (text.includes('ete') || text.includes('eta') || text.includes('efluente') || text.includes('água') || text.includes('agua') || text.includes('drenagem')) return Droplets;
  if (text.includes('emiss') || text.includes('odor') || text.includes('ruído') || text.includes('ruido')) return Leaf;
  if (text.includes('notifica') || text.includes('infração') || text.includes('infracao') || text.includes('não conformidade')) return ShieldAlert;
  if (text.includes('reuni') || text.includes('orient') || text.includes('dúvida') || text.includes('duvida')) return Handshake;
  if (text.includes('agendar') || text.includes('prazo') || text.includes('vistoria')) return CalendarClock;
  if (text.includes('compr') || text.includes('material') || text.includes('caminh')) return Truck;
  if (text.includes('melhoria') || text.includes('correção') || text.includes('correcao') || text.includes('ajuste')) return Wrench;
  if (text.includes('auditoria') || text.includes('diagnóstico') || text.includes('diagnostico') || text.includes('verificar')) return ClipboardCheck;
  if (text.includes('retirar') || text.includes('pegar') || text.includes('emitir')) return FileInput;
  if (text.includes('trein')) return Sparkles;
  if (text.includes('condicionante') || text.includes('conformidade')) return BadgeCheck;
  if (text.includes('alert') || text.includes('pendência') || text.includes('pendencia')) return Bell;
  return kind === 'acao' ? Wrench : BriefcaseBusiness;
}

function getTextStyle(label: string, kind: 'tipo' | 'acao'): React.CSSProperties {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  const length = label.length;
  const baseSize = kind === 'acao' ? 13.5 : 14;
  const lengthPenalty = length > 48 ? 2.2 : length > 38 ? 1.6 : length > 28 ? 0.9 : 0;
  const wordPenalty = longestWord > 18 ? 1 : longestWord > 14 ? 0.5 : 0;
  const fontSize = Math.max(kind === 'acao' ? 11.2 : 11.6, baseSize - lengthPenalty - wordPenalty);

  return {
    fontSize: `${fontSize}px`,
    lineHeight: '1.08',
    overflowWrap: 'normal',
    wordBreak: 'normal',
    textWrap: 'balance',
  };
}

interface VisitSelectionTileProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  meta?: string;
  description?: string;
  kind?: 'tipo' | 'acao';
  className?: string;
}

export function VisitSelectionTile({
  label,
  selected = false,
  onClick,
  meta,
  description,
  kind = 'tipo',
  className,
}: VisitSelectionTileProps) {
  const tone = getTone(label);
  const Icon = pickIcon(label, kind);

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-pressed={selected}
      className={cn(
        'group flex w-full min-w-0 flex-col rounded-md border px-2.5 py-1.5 text-left transition-all',
        kind === 'acao' ? 'min-h-[50px]' : 'min-h-[56px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected ? tone.selected : tone.base,
        className,
      )}
    >
      <span className="flex min-w-0 items-start gap-2">
        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded', selected ? 'bg-white/20 text-white' : tone.icon)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 whitespace-normal font-semibold line-clamp-2" style={getTextStyle(label, kind)}>
          {label}
        </span>
      </span>
      {meta && <span className={cn('ml-7 line-clamp-1 text-[8.5px] leading-none', selected ? 'text-white/80' : 'text-muted-foreground')}>{meta}</span>}
      {kind !== 'acao' && description && <span className={cn('ml-7 line-clamp-1 text-[9px] leading-tight', selected ? 'text-white/80' : 'text-muted-foreground')}>{description}</span>}
    </button>
  );
}
