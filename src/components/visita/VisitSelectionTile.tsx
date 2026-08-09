import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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

type TextFitConfig = {
  fontSize: number;
  minFontSize: number;
  lines: number;
  lineHeight: number;
};

const LABEL_FIT_OVERRIDES: Record<string, Partial<TextFitConfig>> = {
  'Adequação conforme projeto': { fontSize: 12.8 },
  'Armazenamento de materiais': { fontSize: 12.8 },
  'Compra ou solicitação de materiais': { fontSize: 11.6, lines: 3 },
  'Controle ambiental da obra': { fontSize: 12.4 },
  'Drenagem e escoamento': { fontSize: 13.1 },
  'Instalação de ETE ou ETA': { fontSize: 12.8 },
  'Instalação de sistema ambiental': { fontSize: 11.8, lines: 3 },
  'Instalação hidráulica ou sanitária': { fontSize: 11.2, lines: 3 },
  'Interferência em vegetação ou APP': { fontSize: 11.3, lines: 3 },
  'Orientação à equipe de obra': { fontSize: 12.5 },
  'Pendências anteriores da obra': { fontSize: 12, lines: 3 },
  'Resíduos da construção': { fontSize: 13.1 },
  'Segurança e organização do canteiro': { fontSize: 10.8, lines: 3 },
  'Terraplenagem e escavação': { fontSize: 12.7 },
  'Comparar execução com projeto': { fontSize: 12 },
  'Conferir drenagem provisória': { fontSize: 12.1 },
  'Conferir instalação executada': { fontSize: 11.8, lines: 3 },
  'Conferir resíduos da obra': { fontSize: 12.4 },
  'Entregar ou revisar planta/projeto': { fontSize: 11.2, lines: 3 },
  'Orientar responsável da obra': { fontSize: 11.8, lines: 3 },
  'Registrar evolução fotográfica': { fontSize: 11.8, lines: 3 },
  'Registrar não conformidade': { fontSize: 12.1 },
  'Registrar pendência de obra': { fontSize: 12.2 },
  'Solicitar ajuste de execução': { fontSize: 11.9 },
  'Solicitar compra de material': { fontSize: 12 },
  'Tirar dúvidas da equipe': { fontSize: 12.6 },
  'Validar correção realizada': { fontSize: 12.2 },
  'Verificar organização do canteiro': { fontSize: 11.4, lines: 3 },

  'Água e abastecimento': { fontSize: 13.2 },
  'Área externa e drenagem': { fontSize: 12.7 },
  'Armazenamento de produtos': { fontSize: 12.5 },
  'Boas práticas operacionais': { fontSize: 12.3 },
  'Coleta ou amostragem': { fontSize: 13 },
  'Condicionantes de licença': { fontSize: 12.2 },
  'Destinação de resíduos': { fontSize: 12.8 },
  'Documentação ambiental': { fontSize: 12.8 },
  'Efluentes líquidos e ETE': { fontSize: 12.5 },
  'Emissões atmosféricas': { fontSize: 12.8 },
  'Gestão ambiental geral': { fontSize: 12.9 },
  'Não conformidades ambientais': { fontSize: 11.6, lines: 3 },
  'Treinamento ou orientação ambiental': { fontSize: 11.1, lines: 3 },
  'Conferir acondicionamento de resíduos': { fontSize: 10.6, lines: 3 },
  'Conferir caçamba ou armazenamento': { fontSize: 10.8, lines: 3 },
  'Conferir lançamento de efluente': { fontSize: 11.2, lines: 3 },
  'Conferir odor ou extravasamento': { fontSize: 11.3, lines: 3 },
  'Registrar evidências fotográficas': { fontSize: 11.3, lines: 3 },
  'Registrar não conformidade ambiental': { fontSize: 10.6, lines: 3 },
  'Registrar pendência ambiental': { fontSize: 11.5, lines: 3 },
  'Repassar orientação em campo': { fontSize: 11.8, lines: 3 },
  'Verificar abastecimento de água': { fontSize: 11.3, lines: 3 },
  'Verificar destinação/comprovantes': { fontSize: 10.8, lines: 3 },
  'Verificar emissão atmosférica aparente': { fontSize: 10.2, lines: 3 },
  'Verificar segregação de resíduos': { fontSize: 11.1, lines: 3 },

  'Análise técnica do órgão': { fontSize: 12.7 },
  'Cadastro ou atualização ambiental': { fontSize: 11.3, lines: 3 },
  'Condicionantes do processo': { fontSize: 12.2 },
  'Licenciamento ambiental de processo': { fontSize: 10.9, lines: 3 },
  'Regularização ambiental de processo': { fontSize: 10.5, lines: 3 },
  'Retirada de licença ou documento': { fontSize: 11.2, lines: 3 },
  'Reunião institucional': { fontSize: 12.9 },
  'Taxas e emolumentos': { fontSize: 13.1 },
  'Atualizar status do processo': { fontSize: 11.8, lines: 3 },
  'Complementar documentação': { fontSize: 12.2 },
  'Conferir pendências do processo': { fontSize: 11.3, lines: 3 },
  'Consultar andamento do processo': { fontSize: 11.1, lines: 3 },
  'Entregar comprovante de pagamento': { fontSize: 10.8, lines: 3 },
  'Esclarecer exigência técnica': { fontSize: 11.8, lines: 3 },
  'Reagendar prazo ou atendimento': { fontSize: 11.5, lines: 3 },
  'Registrar orientação recebida': { fontSize: 11.7, lines: 3 },
  'Retirar licença ou documento': { fontSize: 11.4, lines: 3 },
  'Retirar notificação ou auto de infração': { fontSize: 10, lines: 3, minFontSize: 9.2 },
  'Reunir com secretário ou gestor': { fontSize: 11.5, lines: 3 },
  'Reunir com técnico do órgão': { fontSize: 11.8, lines: 3 },
  'Solicitar prioridade ou análise': { fontSize: 11.5, lines: 3 },
};

function getFitConfig(label: string, kind: 'tipo' | 'acao'): TextFitConfig {
  const words = label.trim().split(/\s+/).filter(Boolean);
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  const length = label.length;
  const baseSize = kind === 'acao' ? 13.5 : 14;
  const lengthPenalty = length > 48 ? 2.2 : length > 38 ? 1.6 : length > 28 ? 0.9 : 0;
  const wordPenalty = longestWord > 18 ? 1 : longestWord > 14 ? 0.5 : 0;
  const fontSize = Math.max(kind === 'acao' ? 11.2 : 11.6, baseSize - lengthPenalty - wordPenalty);
  const override = LABEL_FIT_OVERRIDES[label] ?? {};

  return {
    fontSize: override.fontSize ?? fontSize,
    minFontSize: override.minFontSize ?? (kind === 'acao' ? 9.8 : 10.2),
    lines: override.lines ?? (length > 32 ? 3 : 2),
    lineHeight: override.lineHeight ?? 1.04,
  };
}

function getTextStyle(config: TextFitConfig, fontSize: number): CSSProperties {
  return {
    fontSize: `${fontSize}px`,
    lineHeight: String(config.lineHeight),
    hyphens: 'none',
    maxHeight: `${config.fontSize * config.lineHeight * config.lines}px`,
    overflow: 'hidden',
    overflowWrap: 'normal',
    textOverflow: 'clip',
    textWrap: 'balance',
    whiteSpace: 'normal',
    wordBreak: 'normal',
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
  const textRef = useRef<HTMLSpanElement>(null);
  const fitConfig = useMemo(() => getFitConfig(label, kind), [label, kind]);
  const [fontSize, setFontSize] = useState(fitConfig.fontSize);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return;

    let nextFontSize = fitConfig.fontSize;
    element.style.fontSize = `${nextFontSize}px`;
    element.style.lineHeight = String(fitConfig.lineHeight);

    while (
      nextFontSize > fitConfig.minFontSize &&
      (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1)
    ) {
      nextFontSize = Number((nextFontSize - 0.2).toFixed(1));
      element.style.fontSize = `${nextFontSize}px`;
    }

    setFontSize(nextFontSize);
  }, [fitConfig, label]);

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
        <span ref={textRef} className="min-w-0 flex-1 whitespace-normal font-semibold" style={getTextStyle(fitConfig, fontSize)}>
          {label}
        </span>
      </span>
      {meta && <span className={cn('ml-7 line-clamp-1 text-[8.5px] leading-none', selected ? 'text-white/80' : 'text-muted-foreground')}>{meta}</span>}
      {kind !== 'acao' && description && <span className={cn('ml-7 line-clamp-1 text-[9px] leading-tight', selected ? 'text-white/80' : 'text-muted-foreground')}>{description}</span>}
    </button>
  );
}
