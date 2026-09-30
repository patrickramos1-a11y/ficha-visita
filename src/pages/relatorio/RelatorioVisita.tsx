import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  CloudRain,
  Copy,
  Droplets,
  FileWarning,
  Fuel,
  Image,
  Info,
  ListChecks,
  MessageSquare,
  Recycle,
  Share2,
  UserRound,
  Waves,
  Wind,
} from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ResumoRelatorioEditor } from '@/components/relatorio/ResumoRelatorioEditor';
import { supabase } from '@/integrations/supabase/client';
import {
  buildEnvironmentalConformityReport,
  buildWorksConformityReport,
  isConformityVisitMode,
  type ConformityCounts,
  type ConformityModule,
  visitModeLabel,
} from '@/lib/conformityReport';
import { buildPersonalizadoConformityReport, type PersonalizadoReport } from '@/lib/atendimentoPersonalizado';
import { groupReportEvidence } from '@/lib/reportEvidence';
import { cn } from '@/lib/utils';
import type { AcompanhamentoAmbientalData, AcompanhamentoObraData, NaoConformidadeObra, PendenciaObra } from '@/types/atendimento';
import { toast } from 'sonner';

type SavedPhoto = {
  id: string;
  foto_url: string;
  tipo: 'inicial' | 'durante' | 'final';
  metadata_compressao?: Record<string, unknown> | null;
  atendimento_personalizado_modulo_id?: string | null;
  atendimento_personalizado_item_id?: string | null;
  atendimento_personalizado_item_ids?: string[] | null;
  tipo_evidencia?: string | null;
  legenda?: string | null;
};

function formatDate(value?: string | null) {
  return value ? format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Não informado';
}

function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return 'Não informado';
  const minutes = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

function Counts({ counts }: { counts: ConformityCounts }) {
  return (
    <div className="grid grid-cols-4 gap-2 text-center text-xs">
      <div className="rounded-md bg-emerald-50 px-2 py-2 text-emerald-800"><strong className="block text-base">{counts.conforme}</strong>Conformes</div>
      <div className="rounded-md bg-amber-50 px-2 py-2 text-amber-800"><strong className="block text-base">{counts.parcial}</strong>Parciais</div>
      <div className="rounded-md bg-red-50 px-2 py-2 text-red-800"><strong className="block text-base">{counts.naoConforme}</strong>Não conf.</div>
      <div className="rounded-md bg-slate-100 px-2 py-2 text-slate-600"><strong className="block text-base">{counts.naoSeAplica}</strong>N/A</div>
    </div>
  );
}

function Percentage({ value, className }: { value: number | null; className?: string }) {
  return (
    <span className={cn('font-semibold tabular-nums', className)}>
      {value === null ? 'N/A' : `${value}%`}
    </span>
  );
}

function ModuleCard({ module }: { module: ConformityModule }) {
  const barColor = module.percentage === null
    ? 'bg-slate-400'
    : module.percentage >= 80
      ? 'bg-emerald-600'
      : module.percentage >= 50
        ? 'bg-amber-500'
        : 'bg-red-600';

  return (
    <Card className="shadow-none">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm">{module.title}</h3>
            <p className="text-xs text-muted-foreground">{module.items.length} itens avaliados</p>
          </div>
          <Percentage value={module.percentage} className="text-2xl" />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className={cn('h-full rounded-full transition-none', barColor)} style={{ width: `${module.percentage ?? 0}%` }} />
        </div>
        <Counts counts={module.counts} />
      </CardContent>
    </Card>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return (
    <div className="flex min-w-0 gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function personalizedModulePresentation(title: string) {
  const normalized = title.toLocaleLowerCase('pt-BR');

  if (normalized.includes('identificação')) return { icon: ClipboardCheck, iconClass: 'bg-sky-100 text-sky-700', cardClass: 'border-sky-200 border-l-sky-400 bg-sky-50/40' };
  if (normalized.includes('resíduo')) return { icon: Recycle, iconClass: 'bg-emerald-100 text-emerald-700', cardClass: 'border-emerald-200 border-l-emerald-400 bg-emerald-50/40' };
  if (normalized.includes('sanitário')) return { icon: Droplets, iconClass: 'bg-cyan-100 text-cyan-700', cardClass: 'border-cyan-200 border-l-cyan-400 bg-cyan-50/40' };
  if (normalized.includes('pluvial')) return { icon: CloudRain, iconClass: 'bg-blue-100 text-blue-700', cardClass: 'border-blue-200 border-l-blue-400 bg-blue-50/40' };
  if (normalized.includes('oleosa') || normalized.includes('sao')) return { icon: Waves, iconClass: 'bg-teal-100 text-teal-700', cardClass: 'border-teal-200 border-l-teal-400 bg-teal-50/40' };
  if (normalized.includes('combust')) return { icon: Fuel, iconClass: 'bg-amber-100 text-amber-700', cardClass: 'border-amber-200 border-l-amber-400 bg-amber-50/40' };
  if (normalized.includes('emiss') || normalized.includes('ruído')) return { icon: Wind, iconClass: 'bg-indigo-100 text-indigo-700', cardClass: 'border-indigo-200 border-l-indigo-400 bg-indigo-50/40' };
  return { icon: ListChecks, iconClass: 'bg-slate-100 text-slate-700', cardClass: 'border-slate-200 border-l-slate-400 bg-slate-50/40' };
}

function isOpen(status?: string) {
  return status !== 'CONCLUIDO';
}

async function fingerprintPhoto(photo: SavedPhoto) {
  try {
    const response = await fetch(photo.foto_url);
    if (!response.ok || !crypto.subtle) return `url:${photo.foto_url}`;
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `sha256:${hex}`;
  } catch {
    return `url:${photo.foto_url}`;
  }
}

export default function RelatorioVisita() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('editar') === '1';

  const { data: atendimento, isLoading, isError, refetch } = useQuery({
    queryKey: ['relatorio-visita', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimentos')
        .select('*, cliente:clientes(nome), responsavel:responsaveis(nome)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Record<string, any>;
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['relatorio-visita-clientes', id],
    enabled: Boolean(id && atendimento),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimento_clientes')
        .select('cliente:clientes(id, nome)')
        .eq('atendimento_id', id);
      if (error) throw error;
      return (data ?? []) as { cliente?: { id: string; nome: string } }[];
    },
  });

  const { data: fotos = [] } = useQuery({
    queryKey: ['relatorio-visita-fotos', id],
    enabled: Boolean(id && atendimento),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimento_fotos')
        .select('id, foto_url, tipo, metadata_compressao, atendimento_personalizado_modulo_id, atendimento_personalizado_item_id, tipo_evidencia, legenda')
        .eq('atendimento_id', id)
        .order('created_at');
      if (error && /(metadata_compressao|atendimento_personalizado_modulo_id|atendimento_personalizado_item_id|tipo_evidencia|legenda)/i.test(String(error.message))) {
        const fallback = await (supabase as any)
          .from('atendimento_fotos')
          .select('id, foto_url, tipo')
          .eq('atendimento_id', id)
          .order('created_at');
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as SavedPhoto[];
      }
      if (error) throw error;
      return (data ?? []) as SavedPhoto[];
    },
  });

  const { data: fotoItemLinks = [] } = useQuery({
    queryKey: ['relatorio-visita-foto-itens', id, fotos.map((foto) => foto.id).join(',')],
    enabled: Boolean(id && atendimento && fotos.length),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimento_foto_itens')
        .select('foto_id, item_id')
        .in('foto_id', fotos.map((foto) => foto.id));
      if (error && /atendimento_foto_itens|schema cache/i.test(String(error.message))) return [];
      if (error) throw error;
      return (data ?? []) as Array<{ foto_id: string; item_id: string }>;
    },
  });

  const fotosComItens = useMemo(() => {
    const linksByPhoto = new Map<string, string[]>();
    for (const link of fotoItemLinks) {
      const current = linksByPhoto.get(link.foto_id) ?? [];
      current.push(link.item_id);
      linksByPhoto.set(link.foto_id, current);
    }
    return fotos.map((foto) => {
      const linked = linksByPhoto.get(foto.id) ?? [];
      const itemIds = Array.from(new Set([...(foto.atendimento_personalizado_item_ids ?? []), foto.atendimento_personalizado_item_id, ...linked].filter(Boolean) as string[]));
      return { ...foto, atendimento_personalizado_item_ids: itemIds };
    });
  }, [fotoItemLinks, fotos]);

  const { data: fotoFingerprints = {}, isLoading: isConsolidatingEvidence } = useQuery({
    queryKey: ['relatorio-visita-foto-fingerprints', fotos.map((foto) => `${foto.id}:${foto.foto_url}`).join(',')],
    enabled: fotos.length > 0,
    staleTime: Infinity,
    queryFn: async () => {
      const pairs = await Promise.all(fotos.map(async (foto) => [foto.id, await fingerprintPhoto(foto)] as const));
      return Object.fromEntries(pairs) as Record<string, string>;
    },
  });

  const evidenceGroups = useMemo(
    () => groupReportEvidence(fotosComItens, fotoFingerprints),
    [fotoFingerprints, fotosComItens],
  );

  const { data: demandas = [] } = useQuery({
    queryKey: ['relatorio-visita-demandas', id],
    enabled: Boolean(id && atendimento),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('demandas')
        .select('id, descricao, status, tipo_atendimento, plano')
        .eq('atendimento_id', id);
      if (error) throw error;
      return (data ?? []) as Array<Record<string, any>>;
    },
  });

  const processOrgaoIds = ((atendimento?.dados_modalidade as any)?.orgao_ids ?? []) as string[];
  const processProcessoIds = ((atendimento?.dados_modalidade as any)?.processo_ids ?? []) as string[];

  const { data: orgaosProcessos = [] } = useQuery({
    queryKey: ['relatorio-visita-orgaos', processOrgaoIds],
    enabled: Boolean(atendimento?.modo === 'processos' && processOrgaoIds.length),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('orgaos')
        .select('id, nome')
        .in('id', processOrgaoIds);
      if (error) throw error;
      return (data ?? []) as Array<Record<string, any>>;
    },
  });

  const { data: processosDetalhes = [] } = useQuery({
    queryKey: ['relatorio-visita-processos-detalhes', processProcessoIds],
    enabled: Boolean(atendimento?.modo === 'processos' && processProcessoIds.length),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('processos_clientes')
        .select('id, nome, situacao_atual, orgaos(nome), clientes(nome)')
        .in('id', processProcessoIds);
      if (error) throw error;
      return (data ?? []) as Array<Record<string, any>>;
    },
  });

  const report = useMemo(() => {
    if (!atendimento || !isConformityVisitMode(atendimento.modo)) return null;
    const data = (atendimento.dados_modalidade ?? {}) as Record<string, unknown>;
    return atendimento.modo === 'obras'
      ? buildWorksConformityReport((data as unknown) as AcompanhamentoObraData)
      : buildEnvironmentalConformityReport((data as unknown) as AcompanhamentoAmbientalData);
  }, [atendimento]);

  const personalizedReport: PersonalizadoReport | null = useMemo(() => {
    if (!atendimento || atendimento.modo !== 'personalizado') return null;
    return buildPersonalizadoConformityReport(atendimento.dados_modalidade, fotosComItens);
  }, [atendimento, fotosComItens]);

  if (isLoading) {
    return <div className="min-h-screen bg-background grid place-items-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  if (!atendimento || isError) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Relatório não encontrado</h1>
          <p className="text-sm text-muted-foreground">Esta visita pode não existir mais ou o link está incompleto.</p>
          <Button variant="outline" onClick={() => navigate('/desktop/historico')}>Ir para o histórico</Button>
        </div>
      </div>
    );
  }

  const dados = (atendimento.dados_modalidade ?? {}) as AcompanhamentoObraData | AcompanhamentoAmbientalData;
  const clientNames = clientes.map((item) => item.cliente?.nome).filter(Boolean) as string[];
  const fallbackClient = (dados as any).cliente_nome || atendimento.cliente?.nome;
  const allClientNames = clientNames.length ? clientNames : fallbackClient ? [fallbackClient] : [];
  const naoConformidades = ((dados as any).nao_conformidades ?? []) as NaoConformidadeObra[];
  const pendencias = ((dados as any).pendencias ?? []) as PendenciaObra[];
  const pendenciasAbertas = pendencias.filter((item) => isOpen(item.status));
  const highSeverity = naoConformidades.filter((item) => item.gravidade === 'ALTA');
  const anotacoesItens = ((atendimento.anotacoes_itens ?? []) as any[]).filter((item) => item?.texto?.trim?.());
  const processoData = atendimento.modo === 'processos' ? ((atendimento.dados_modalidade ?? {}) as Record<string, any>) : null;
  const start = atendimento.data_inicio ?? atendimento.created_at;
  const end = atendimento.data_fim;
  const shareUrl = `${window.location.origin}/relatorio/visita/${atendimento.id}`;
  const evidenceByItem = new Map<string, string[]>();
  for (const evidence of evidenceGroups) {
    for (const itemId of evidence.itemIds) {
      evidenceByItem.set(itemId, [...(evidenceByItem.get(itemId) ?? []), evidence.code]);
    }
  }
  const personalizedItemContext = new Map<string, { moduleTitle: string; itemLabel: string }>();
  for (const module of personalizedReport?.modules ?? []) {
    for (const item of module.items) personalizedItemContext.set(item.id, { moduleTitle: module.title, itemLabel: item.label });
  }
  const scoredPersonalizedItems = personalizedReport
    ? personalizedReport.counts.conforme + personalizedReport.counts.parcial + personalizedReport.counts.naoConforme
    : 0;
  const repeatedPhotoCount = Math.max(0, fotos.length - evidenceGroups.length);
  const getModuleEvidence = (module: PersonalizadoReport['modules'][number]) => {
    const itemIds = new Set(module.items.map((item) => item.id));
    return evidenceGroups.filter((evidence) => evidence.itemIds.some((itemId) => itemIds.has(itemId)));
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link do relatório copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: atendimento.titulo || 'Relatório de conformidade', url: shareUrl });
        return;
      } catch (error) {
        if ((error as DOMException).name === 'AbortError') return;
      }
    }
    await copyLink();
  };

  const saveResumo = async (values: { comentario_base_relatorio: string; resumo_relatorio: string; resumo_relatorio_gerado_em?: string }) => {
    const { error } = await (supabase as any)
      .from('atendimentos')
      .update(values)
      .eq('id', atendimento.id);
    if (error) throw error;
    await refetch();
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate('/desktop/historico')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" aria-label="Voltar ao histórico">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
          </button>
          <img src={logoHorizontal} alt="Ramos Engenharia" className="h-8 max-w-[150px] object-contain" />
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={copyLink} title="Copiar link"><Copy className="h-4 w-4" /></Button>
            <Button type="button" size="sm" onClick={shareReport} className="gap-2"><Share2 className="h-4 w-4" /><span className="hidden sm:inline">Compartilhar</span></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <section className="border-b border-primary/20 bg-card p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="space-y-3">
              <Badge variant="secondary">{visitModeLabel(atendimento.modo)}</Badge>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">{atendimento.titulo || visitModeLabel(atendimento.modo)}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Relatório digital de visita técnica</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow icon={Building2} label="Cliente" value={allClientNames.join(', ') || 'Não informado'} />
                <DetailRow icon={UserRound} label="Responsável técnico" value={atendimento.responsavel?.nome || 'Não informado'} />
                <DetailRow icon={CalendarDays} label="Início" value={formatDate(start)} />
                <DetailRow icon={Clock3} label="Duração" value={formatDuration(start, end)} />
              </div>
            </div>
            {report || personalizedReport ? (
              <div className="min-w-[178px] border-l-4 border-primary bg-primary/5 px-5 py-4 text-center">
                <p className="text-xs font-medium uppercase text-muted-foreground">Conformidade geral</p>
                <Percentage value={(report?.percentage ?? personalizedReport?.percentage) ?? null} className="block pt-1 text-5xl text-primary" />
                <p className="mt-1 text-xs text-muted-foreground">N/A não entra no cálculo</p>
              </div>
            ) : (
              <div className="min-w-[178px] border-l-4 border-primary bg-primary/5 px-5 py-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Registro técnico</p>
                <p className="pt-1 text-2xl font-semibold text-primary">{(atendimento.tipos_atendimento ?? []).length} tipos</p>
                <p className="mt-1 text-xs text-muted-foreground">{(atendimento.acoes_especificas ?? []).length} ações registradas</p>
              </div>
            )}
          </div>
        </section>

        {editMode && (
          <ResumoRelatorioEditor
            visit={atendimento}
            clientes={allClientNames}
            responsavel={atendimento.responsavel?.nome}
            demandas={demandas as any}
            comentarios={anotacoesItens}
            dadosModalidade={atendimento.dados_modalidade}
            initialComentario={atendimento.comentario_base_relatorio}
            initialResumo={atendimento.resumo_relatorio}
            onSave={saveResumo}
          />
        )}

        {personalizedReport ? (
          <section className="border-y bg-card px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">Conclusão da visita</h2>
                <p className="mt-1 text-sm leading-6 text-foreground/90">
                  {personalizedReport.alerts.length === 0
                    ? `Inspeção concluída sem alertas ou não conformidades. Os ${scoredPersonalizedItems} controles que entram no cálculo estão conformes, resultando em ${personalizedReport.percentage ?? 0}% de conformidade.`
                    : `Inspeção concluída com ${personalizedReport.alerts.length} ponto${personalizedReport.alerts.length === 1 ? '' : 's'} que exige${personalizedReport.alerts.length === 1 ? '' : 'm'} atenção. Consulte os módulos sinalizados antes de definir as providências.`}
                  {personalizedReport.counts.registros > 0 ? ` ${personalizedReport.counts.registros} registro${personalizedReport.counts.registros === 1 ? '' : 's'} informativo${personalizedReport.counts.registros === 1 ? '' : 's'} foi documentado sem afetar o índice.` : ''}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-slate-600"><ListChecks className="h-4 w-4" />Controles avaliáveis</dt>
                <dd className="mt-3 font-mono text-3xl font-bold tabular-nums text-slate-900">{scoredPersonalizedItems}</dd>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4" />Conformes</dt>
                <dd className="mt-3 font-mono text-3xl font-bold tabular-nums text-emerald-800">{personalizedReport.counts.conforme}</dd>
              </div>
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-sky-700"><Info className="h-4 w-4" />Registros informativos</dt>
                <dd className="mt-3 font-mono text-3xl font-bold tabular-nums text-sky-900">{personalizedReport.counts.registros}</dd>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <dt className="flex items-center gap-2 text-xs font-medium text-amber-700"><Image className="h-4 w-4" />Evidências únicas</dt>
                <dd className="mt-3 font-mono text-3xl font-bold tabular-nums text-amber-900">{isConsolidatingEvidence ? '...' : evidenceGroups.length}</dd>
              </div>
            </dl>

            {atendimento.resumo_relatorio ? (
              <div className="mt-5 border-l-2 border-primary pl-4">
                <p className="text-xs font-medium uppercase text-muted-foreground">Observação técnica</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-foreground/90">{atendimento.resumo_relatorio}</p>
              </div>
            ) : null}

            <details className="mt-5 border-t pt-4">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                Ver escopo técnico e atividades ({(atendimento.tipos_atendimento ?? []).length} frentes, {(atendimento.acoes_especificas ?? []).length} ações)
              </summary>
              <div className="mt-4 grid gap-5 text-sm md:grid-cols-2">
                <div>
                  <h3 className="font-medium">Frentes verificadas</h3>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    {(atendimento.tipos_atendimento ?? []).map((item: string) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">Ações registradas</h3>
                  <ul className="mt-2 columns-1 gap-6 space-y-1 text-muted-foreground sm:columns-2 md:columns-1 lg:columns-2">
                    {(atendimento.acoes_especificas ?? []).map((item: string) => <li key={item} className="break-inside-avoid">• {item}</li>)}
                  </ul>
                </div>
              </div>
            </details>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="shadow-none"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /><h2 className="font-semibold">Resumo técnico</h2></div>{atendimento.resumo_relatorio ? <div className="whitespace-pre-line text-sm leading-6 text-foreground/90">{atendimento.resumo_relatorio}</div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Nenhum resumo técnico foi salvo para esta visita.</p>}</CardContent></Card>
            <Card className="shadow-none"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h2 className="font-semibold">Atendimentos e ações</h2></div><p className="text-sm text-muted-foreground">{(atendimento.tipos_atendimento ?? []).length} tipos de atendimento e {(atendimento.acoes_especificas ?? []).length} ações registrados.</p></CardContent></Card>
          </section>
        )}

        {report && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Conformidade por módulo</h2>
              <span className="text-xs text-muted-foreground">{report.modules.length} módulos</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {report.modules.map((module) => <ModuleCard key={module.id} module={module} />)}
            </div>
          </section>
        )}

        {personalizedReport && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Resultado por módulo</h2>
                <p className="text-sm text-muted-foreground">Leitura compacta dos controles avaliados e das evidências associadas.</p>
              </div>
              <span className="text-xs text-muted-foreground">{personalizedReport.modules.length} módulos</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {personalizedReport.modules.map((module) => {
                const moduleEvidence = getModuleEvidence(module);
                const evaluated = module.counts.conforme + module.counts.parcial + module.counts.naoConforme;
                const presentation = personalizedModulePresentation(module.title);
                const ModuleIcon = presentation.icon;
                const requiresAttention = module.counts.parcial + module.counts.naoConforme > 0;
                return (
                  <details key={module.id} className={cn('group overflow-hidden rounded-lg border border-l-4 shadow-sm', presentation.cardClass)}>
                    <summary className="cursor-pointer list-none p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', presentation.iconClass)}>
                            <ModuleIcon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-semibold leading-5">{module.title}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {evaluated > 0 ? `${module.counts.conforme} de ${evaluated} controles conformes` : 'Módulo de registro'}
                              {module.counts.registros > 0 ? ` • ${module.counts.registros} informativo${module.counts.registros === 1 ? '' : 's'}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                          requiresAttention
                            ? 'border-amber-200 bg-amber-50 text-amber-800'
                            : module.percentage === null
                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                        )}>
                          {requiresAttention ? <AlertTriangle className="h-3.5 w-3.5" /> : module.percentage === null ? <Info className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {requiresAttention ? 'Atenção' : module.percentage === null ? 'Informativo' : `${module.percentage}%`}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 border-y py-3">
                        <div className="flex items-baseline gap-2">
                          <p className="text-[11px] font-medium uppercase text-muted-foreground">Controles</p>
                          <p className="font-mono text-lg font-bold tabular-nums">{evaluated || module.counts.registros}</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="text-[11px] font-medium uppercase text-muted-foreground">Evidências</p>
                          <p className="font-mono text-lg font-bold tabular-nums">{moduleEvidence.length}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{module.items.length} itens verificados</span>
                        <span className="flex items-center gap-1 font-medium text-primary">
                          <span className="group-open:hidden">Ver itens</span>
                          <span className="hidden group-open:inline">Ocultar</span>
                          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                        </span>
                      </div>
                    </summary>
                    <div className="divide-y border-t bg-muted/20">
                      {module.items.map((item) => {
                        const evidenceCodes = evidenceByItem.get(item.id) ?? [];
                        return (
                          <div key={item.id} className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{item.label}</p>
                              {item.observation ? <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{item.observation}</p> : null}
                              {evidenceCodes.length ? <p className="mt-2 text-xs text-muted-foreground">Comprovado por <span className="font-medium text-foreground">{evidenceCodes.join(', ')}</span></p> : null}
                            </div>
                            <Badge variant="outline">{item.responseLabel ?? (item.response ? item.response.replaceAll('_', ' ') : 'Sem resposta')}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>

            {personalizedReport.alerts.length ? (
              <div className="space-y-2">{personalizedReport.alerts.map((alert) => <div key={alert.key} className={cn('border-l-4 px-3 py-2 text-sm', alert.severity === 'critical' ? 'border-red-600 bg-red-50 text-red-900' : 'border-amber-500 bg-amber-50 text-amber-900')}><span className="font-medium">{alert.severity === 'critical' ? 'Crítico' : 'Atenção'}:</span> {alert.label}<span className="text-xs opacity-75"> • {alert.moduleTitle}</span></div>)}</div>
            ) : (
              <div className="flex items-center gap-3 border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />Nenhum alerta ou não conformidade identificado.</div>
            )}

          </section>
        )}

        {report && (
          <>
            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /><h2 className="font-semibold">Alertas da visita</h2></div>
                  {report.alerts.length === 0 && pendenciasAbertas.length === 0 && highSeverity.length === 0 ? (
                    <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />Nenhum alerta de conformidade identificado nesta visita.</div>
                  ) : (
                    <div className="space-y-2">
                      {report.alerts.map((alert) => <div key={`${alert.moduleTitle}-${alert.key}`} className={cn('rounded-md border-l-4 px-3 py-2 text-sm', alert.severity === 'critical' ? 'border-red-600 bg-red-50 text-red-900' : 'border-amber-500 bg-amber-50 text-amber-900')}><span className="font-medium">{alert.severity === 'critical' ? 'Crítico' : 'Atenção'}:</span> {alert.label}<span className="text-xs opacity-75"> • {alert.moduleTitle}</span></div>)}
                      {pendenciasAbertas.map((item) => <div key={`pendencia-${item.id}`} className="rounded-md border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-900"><span className="font-medium">Pendência aberta:</span> {item.descricao}</div>)}
                      {highSeverity.map((item) => <div key={`nc-${item.id}`} className="rounded-md border-l-4 border-red-600 bg-red-50 px-3 py-2 text-sm text-red-900"><span className="font-medium">NC de gravidade alta:</span> {item.descricao}</div>)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2"><FileWarning className="h-5 w-5 text-red-600" /><h2 className="font-semibold">Não conformidades</h2></div>
                  {naoConformidades.length === 0 ? <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />Nenhuma não conformidade cadastrada.</div> : <div className="space-y-2">{naoConformidades.map((item) => <div key={item.id} className="rounded-md border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-sm">{item.tipo || 'Não conformidade'}</p><Badge variant={item.gravidade === 'ALTA' ? 'destructive' : 'secondary'}>{item.gravidade}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.descricao}</p><p className="mt-2 text-xs text-muted-foreground">{item.responsavel || 'Sem responsável'} • {item.prazo || 'Sem prazo'} • {item.status.replace('_', ' ')}</p></div>)}</div>}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Pendências</h2></div>
                  {pendencias.length === 0 ? <div className="flex items-center gap-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="h-5 w-5 shrink-0" />Tudo certo: não há pendências cadastradas.</div> : <div className="space-y-2">{pendencias.map((item) => <div key={item.id} className="rounded-md border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-sm">{item.descricao}</p><Badge variant={isOpen(item.status) ? 'secondary' : 'outline'}>{item.status.replace('_', ' ')}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.responsavel || 'Sem responsável'} • {item.prazo || 'Sem prazo'} • Prioridade {item.prioridade}</p></div>)}</div>}
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /><h2 className="font-semibold">Resumo da avaliação</h2></div>
                  <Counts counts={report.counts} />
                  <p className="text-sm text-muted-foreground">A conformidade geral é a média dos itens avaliados: conforme vale 100, parcial vale 50 e não conforme vale 0. Itens N/A são excluídos do cálculo.</p>
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {processoData && (
          <section className="space-y-3">
            <div className="flex items-center gap-2"><ListChecks className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Processos acompanhados</h2></div>
            <Card className="shadow-none">
              <CardContent className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Clientes vinculados</p>
                    <p className="text-2xl font-semibold">{(processoData.cliente_ids ?? []).length || allClientNames.length}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Órgãos acompanhados</p>
                    <p className="text-2xl font-semibold">{(processoData.orgao_ids ?? []).length}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground">Processos acompanhados</p>
                    <p className="text-2xl font-semibold">{(processoData.processo_ids ?? []).length}</p>
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Órgãos</p>
                    {orgaosProcessos.length ? <div className="flex flex-wrap gap-1.5">{orgaosProcessos.map((orgao) => <Badge key={orgao.id} variant="secondary">{orgao.nome}</Badge>)}</div> : <p className="text-sm text-muted-foreground">Nenhum órgão detalhado nesta visita.</p>}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Processos</p>
                    {processosDetalhes.length ? <div className="space-y-2">{processosDetalhes.map((processo) => <div key={processo.id} className="rounded-md border p-3 text-sm"><p className="font-medium">{processo.nome}</p><p className="text-xs text-muted-foreground">{processo.clientes?.nome ?? 'Cliente não informado'} • {processo.orgaos?.nome ?? 'Sem órgão'} • {String(processo.situacao_atual ?? 'AGUARDANDO_ANALISE').replaceAll('_', ' ')}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhum processo detalhado nesta visita.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
            <div className="flex items-center gap-2"><Image className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Evidências fotográficas</h2></div>
            <p className="text-sm text-muted-foreground">
                  {isConsolidatingEvidence ? 'Consolidando imagens...' : `${evidenceGroups.length} evidência${evidenceGroups.length === 1 ? '' : 's'} única${evidenceGroups.length === 1 ? '' : 's'}${repeatedPhotoCount ? ` • ${repeatedPhotoCount} ${repeatedPhotoCount === 1 ? 'repetição removida' : 'repetições removidas'}` : ''}`}
            </p>
          </div>
          {fotos.length === 0 ? (
            <div className="border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Nenhuma foto foi vinculada a esta visita.</div>
          ) : isConsolidatingEvidence ? (
            <div className="border-y bg-card p-6 text-sm text-muted-foreground">Analisando as imagens para eliminar repetições...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {evidenceGroups.map((evidence) => {
                const contexts = evidence.itemIds.map((itemId) => personalizedItemContext.get(itemId)).filter(Boolean) as Array<{ moduleTitle: string; itemLabel: string }>;
                const moduleTitles = [...new Set(contexts.map((context) => context.moduleTitle))];
                const evidenceTitle = moduleTitles.length ? moduleTitles.join(' • ') : evidence.types.includes('final') ? 'Registro final da visita' : 'Registro geral da visita';
                return (
                  <figure key={evidence.code} className="overflow-hidden border bg-card">
                    <img src={evidence.photo.foto_url} alt={`${evidence.code}: ${evidenceTitle}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <figcaption className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-primary">{evidence.code}</p>
                          <h3 className="mt-1 font-medium">{evidenceTitle}</h3>
                        </div>
                        {evidence.photo.metadata_compressao?.detalhe_tecnico ? <span className="text-xs font-medium text-primary">Detalhe técnico</span> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contexts.length
                          ? `Comprova ${contexts.length} ite${contexts.length === 1 ? 'm' : 'ns'} em ${moduleTitles.length} módulo${moduleTitles.length === 1 ? '' : 's'}.`
                          : 'Registro fotográfico geral, sem vínculo obrigatório com um item específico.'}
                        {evidence.duplicateCount > 1 ? ` ${evidence.duplicateCount} registros idênticos foram consolidados nesta evidência.` : ''}
                      </p>
                      {contexts.length ? (
                        <details className="border-t pt-3">
                          <summary className="cursor-pointer text-sm font-medium text-primary">Ver itens comprovados</summary>
                          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {contexts.map((context, index) => <li key={`${evidence.code}-${index}`}><span className="font-medium text-foreground">{context.moduleTitle}:</span> {context.itemLabel}</li>)}
                          </ul>
                        </details>
                      ) : null}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
