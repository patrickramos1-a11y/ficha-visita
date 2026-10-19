import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, getVisitStepsForMode } from '@/components/visita/ProgressStepper';
import { PageHeader, EmptyState, CountBadge, MobileFooter } from '@/components/mobile';
import { useAcoesEspecificasConfig, useTipoAtendimentoAcoes, useTiposAtendimentoConfig } from '@/hooks/useConfigEntities';
import { canonicalizeActionName, canonicalizeTypeName, getAvailableActionsForTypes } from '@/lib/serviceNarrative';
import { cn } from '@/lib/utils';
import {
  Activity,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Droplets,
  Eye,
  FileCheck2,
  GraduationCap,
  Hammer,
  Handshake,
  Leaf,
  Loader2,
  MessageSquareText,
  PlusCircle,
  Search,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

type ActionGroupTheme = {
  icon: LucideIcon;
  frame: string;
  header: string;
  iconBox: string;
  count: string;
  action: string;
  actionSelected: string;
  badge: string;
};

const DEFAULT_GROUP_THEME: ActionGroupTheme = {
  icon: ClipboardList,
  frame: 'border-slate-200',
  header: 'border-slate-200 bg-slate-50',
  iconBox: 'bg-slate-200 text-slate-700',
  count: 'bg-slate-200 text-slate-700',
  action: 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50',
  actionSelected: 'border-slate-700 bg-slate-700 text-white',
  badge: 'bg-slate-100 text-slate-600',
};

const ACTION_GROUP_THEMES: Record<string, ActionGroupTheme> = {
  'Acompanhamento ambiental': { icon: Leaf, frame: 'border-emerald-200', header: 'border-emerald-200 bg-emerald-50', iconBox: 'bg-emerald-600 text-white', count: 'bg-emerald-100 text-emerald-800', action: 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/60', actionSelected: 'border-emerald-600 bg-emerald-600 text-white', badge: 'bg-emerald-100 text-emerald-700' },
  'Avaliação técnica de sistemas de tratamento': { icon: Droplets, frame: 'border-cyan-200', header: 'border-cyan-200 bg-cyan-50', iconBox: 'bg-cyan-600 text-white', count: 'bg-cyan-100 text-cyan-800', action: 'border-cyan-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/60', actionSelected: 'border-cyan-600 bg-cyan-600 text-white', badge: 'bg-cyan-100 text-cyan-700' },
  'Tomada de ciência': { icon: Eye, frame: 'border-sky-200', header: 'border-sky-200 bg-sky-50', iconBox: 'bg-sky-600 text-white', count: 'bg-sky-100 text-sky-800', action: 'border-sky-200 bg-white hover:border-sky-400 hover:bg-sky-50/60', actionSelected: 'border-sky-600 bg-sky-600 text-white', badge: 'bg-sky-100 text-sky-700' },
  'Consultoria ambiental': { icon: MessageSquareText, frame: 'border-violet-200', header: 'border-violet-200 bg-violet-50', iconBox: 'bg-violet-600 text-white', count: 'bg-violet-100 text-violet-800', action: 'border-violet-200 bg-white hover:border-violet-400 hover:bg-violet-50/60', actionSelected: 'border-violet-600 bg-violet-600 text-white', badge: 'bg-violet-100 text-violet-700' },
  'Reunião de alinhamento técnico': { icon: Handshake, frame: 'border-indigo-200', header: 'border-indigo-200 bg-indigo-50', iconBox: 'bg-indigo-600 text-white', count: 'bg-indigo-100 text-indigo-800', action: 'border-indigo-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/60', actionSelected: 'border-indigo-600 bg-indigo-600 text-white', badge: 'bg-indigo-100 text-indigo-700' },
  Planejamento: { icon: CalendarRange, frame: 'border-amber-200', header: 'border-amber-200 bg-amber-50', iconBox: 'bg-amber-500 text-white', count: 'bg-amber-100 text-amber-900', action: 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50/60', actionSelected: 'border-amber-500 bg-amber-500 text-white', badge: 'bg-amber-100 text-amber-800' },
  'Implementação de melhoria': { icon: Hammer, frame: 'border-orange-200', header: 'border-orange-200 bg-orange-50', iconBox: 'bg-orange-600 text-white', count: 'bg-orange-100 text-orange-900', action: 'border-orange-200 bg-white hover:border-orange-400 hover:bg-orange-50/60', actionSelected: 'border-orange-600 bg-orange-600 text-white', badge: 'bg-orange-100 text-orange-800' },
  'Licenciamento ambiental': { icon: FileCheck2, frame: 'border-teal-200', header: 'border-teal-200 bg-teal-50', iconBox: 'bg-teal-600 text-white', count: 'bg-teal-100 text-teal-900', action: 'border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50/60', actionSelected: 'border-teal-600 bg-teal-600 text-white', badge: 'bg-teal-100 text-teal-800' },
  'Fiscalização ambiental': { icon: ShieldCheck, frame: 'border-rose-200', header: 'border-rose-200 bg-rose-50', iconBox: 'bg-rose-600 text-white', count: 'bg-rose-100 text-rose-900', action: 'border-rose-200 bg-white hover:border-rose-400 hover:bg-rose-50/60', actionSelected: 'border-rose-600 bg-rose-600 text-white', badge: 'bg-rose-100 text-rose-800' },
  'Treinamento ambiental': { icon: GraduationCap, frame: 'border-lime-200', header: 'border-lime-200 bg-lime-50', iconBox: 'bg-lime-600 text-white', count: 'bg-lime-100 text-lime-900', action: 'border-lime-200 bg-white hover:border-lime-400 hover:bg-lime-50/60', actionSelected: 'border-lime-700 bg-lime-700 text-white', badge: 'bg-lime-100 text-lime-800' },
  'Levantamento técnico': { icon: Search, frame: 'border-blue-200', header: 'border-blue-200 bg-blue-50', iconBox: 'bg-blue-600 text-white', count: 'bg-blue-100 text-blue-900', action: 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-50/60', actionSelected: 'border-blue-600 bg-blue-600 text-white', badge: 'bg-blue-100 text-blue-800' },
  'Monitoramento ambiental': { icon: Activity, frame: 'border-fuchsia-200', header: 'border-fuchsia-200 bg-fuchsia-50', iconBox: 'bg-fuchsia-600 text-white', count: 'bg-fuchsia-100 text-fuchsia-900', action: 'border-fuchsia-200 bg-white hover:border-fuchsia-400 hover:bg-fuchsia-50/60', actionSelected: 'border-fuchsia-600 bg-fuchsia-600 text-white', badge: 'bg-fuchsia-100 text-fuchsia-800' },
  'Ações adicionais': { ...DEFAULT_GROUP_THEME, icon: PlusCircle },
};

export default function AcoesEspecificas() {
  useVisitRoute('/visita/acoes');
  const navigate = useNavigate();
  const { data, setAcoesEspecificas } = useAtendimento();
  const { data: acoes, isLoading } = useAcoesEspecificasConfig();
  const { data: tipos = [] } = useTiposAtendimentoConfig();
  const { data: links = [] } = useTipoAtendimentoAcoes();
  const [selectedAcoes, setSelectedAcoes] = useState<string[]>(() => Array.from(new Set(data.acoes_especificas.map(canonicalizeActionName))));
  const steps = getVisitStepsForMode(data.modo);

  const toggleAcao = (acao: string) => {
    setSelectedAcoes(prev =>
      prev.includes(acao) ? prev.filter(a => a !== acao) : [...prev, acao]
    );
  };

  const handleContinue = () => {
    setAcoesEspecificas(selectedAcoes);
    navigate('/visita/demandas');
  };

  const natureza = data.natureza ?? 'ATENDIMENTO';
  const baseAcoes = data.modo === 'personalizado'
    ? (data.atendimento_personalizado?.acoes ?? []).filter((a: any) => a.ativo !== false)
    : (acoes || []).filter((a: any) => a.ativo !== false && (a.naturezas ?? ['ATENDIMENTO']).includes(natureza));
  const selectedTypes = Array.from(new Set(data.tipos_atendimento.map(canonicalizeTypeName)));
  const actionGroups = useMemo(() => {
    if (data.modo === 'personalizado' || natureza !== 'ATENDIMENTO') {
      return [{ tipo: 'Ações disponíveis', acoes: baseAcoes }];
    }

    const candidates = selectedTypes.map((tipo) => ({
      tipo,
      acoes: getAvailableActionsForTypes({ tipos, acoes: baseAcoes, links, selectedTypeNames: [tipo] }),
    }));
    const ownerByAction = new Map<string, { tipo: string; score: number; order: number }>();

    candidates.forEach((group, order) => {
      group.acoes.forEach((acao: any) => {
        const score = (acao.relationLabel === 'Principal' ? 0 : 1_000) + (acao.relationPriority ?? 100);
        const current = ownerByAction.get(acao.nome);
        if (!current || score < current.score || (score === current.score && order < current.order)) {
          ownerByAction.set(acao.nome, { tipo: group.tipo, score, order });
        }
      });
    });

    const grouped = candidates.map((group) => ({
      ...group,
      acoes: group.acoes.filter((acao: any) => ownerByAction.get(acao.nome)?.tipo === group.tipo),
    }));
    const visibleNames = new Set(grouped.flatMap((group) => group.acoes.map((acao: any) => acao.nome)));
    const extras = baseAcoes
      .filter((acao: any) => selectedAcoes.includes(acao.nome) && !visibleNames.has(acao.nome))
      .map((acao: any) => ({ ...acao, relationLabel: 'Adicional' }));

    return extras.length ? [...grouped, { tipo: 'Ações adicionais', acoes: extras }] : grouped;
  }, [baseAcoes, data.modo, links, natureza, selectedAcoes, selectedTypes, tipos]);
  const availableAcoes = actionGroups.flatMap((group) => group.acoes);
  const loadingOptions = data.modo === 'personalizado' ? false : isLoading;
  const formatTopicoSubtopico = (item: any) =>
    [item?.topicos?.nome, item?.subtopicos?.nome].filter(Boolean).join(' › ');

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/tipos')} title="Ações Específicas">
      <ProgressStepper steps={steps} currentStep={Math.max(steps.findIndex((step) => step.id === 'acoes'), 0)} />

      <PageHeader
        icon={Wrench}
        title="Ações Executadas"
        description="Selecione as ações específicas realizadas durante a visita"
        badge={<CountBadge count={selectedAcoes.length} />}
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {loadingOptions ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : availableAcoes.length > 0 ? (
          <div className="space-y-5">
            {actionGroups.filter((group) => group.acoes.length > 0).map((group, groupIndex) => {
              const theme = ACTION_GROUP_THEMES[group.tipo] ?? DEFAULT_GROUP_THEME;
              const GroupIcon = data.modo === 'personalizado' ? Wrench : theme.icon;
              return (
              <section key={group.tipo} className={cn('overflow-hidden rounded-lg border', theme.frame)}>
                <div className={cn('flex items-center gap-2.5 border-b px-3 py-2.5', theme.header)}>
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md shadow-sm', theme.iconBox)}>
                    <GroupIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-muted-foreground">GRUPO {groupIndex + 1}</span>
                      <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', theme.count)}>{group.acoes.length} {group.acoes.length === 1 ? 'AÇÃO' : 'AÇÕES'}</span>
                    </div>
                    <h2 className="mt-0.5 text-sm font-semibold leading-5">{group.tipo}</h2>
                  </div>
                </div>
                <div className="grid gap-1.5 bg-white p-2.5 sm:grid-cols-2">
                  {group.acoes.map((acao: any) => {
                    const selected = selectedAcoes.includes(acao.nome);
                    return (
                      <button
                        key={`${group.tipo}-${acao.id}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleAcao(acao.nome)}
                        className={cn(
                          'flex min-h-9 w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                          selected ? theme.actionSelected : theme.action,
                        )}
                      >
                        <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center', selected ? 'text-white' : 'text-muted-foreground/50')}>
                          {selected ? <CheckCircle2 className="h-4 w-4" /> : <Wrench className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1 font-medium leading-4">{acao.nome}</span>
                        <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase', selected ? 'bg-white/15 text-white/85' : theme.badge)}>
                          {data.modo === 'personalizado' ? '' : acao.relationLabel || formatTopicoSubtopico(acao)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
              );
            })}
          </div>
        ) : data.modo !== 'personalizado' && natureza === 'ATENDIMENTO' && data.tipos_atendimento.length === 0 ? (
          <EmptyState icon={Wrench} title="Selecione primeiro o tipo de atendimento" description="As ações serão apresentadas conforme o serviço escolhido." />
        ) : selectedAcoes.length > 0 ? (
          <EmptyState icon={Check} title="Todas as ações selecionadas" />
        ) : (
          <EmptyState icon={Wrench} title="Nenhuma ação disponível" description="Volte e selecione novamente o tipo de atendimento." />
        )}
      </div>

      <MobileFooter>
        <Button onClick={handleContinue} className="w-full h-14 text-lg haptic-press">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
