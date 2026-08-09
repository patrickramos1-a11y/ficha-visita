import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  FileWarning,
  Image,
  Share2,
  UserRound,
} from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  buildEnvironmentalConformityReport,
  buildWorksConformityReport,
  isConformityVisitMode,
  type ConformityCounts,
  type ConformityModule,
  visitModeLabel,
} from '@/lib/conformityReport';
import { cn } from '@/lib/utils';
import type { AcompanhamentoAmbientalData, AcompanhamentoObraData, NaoConformidadeObra, PendenciaObra } from '@/types/atendimento';
import { toast } from 'sonner';

type SavedPhoto = { id: string; foto_url: string; tipo: 'inicial' | 'durante' | 'final' };

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

function isOpen(status?: string) {
  return status !== 'CONCLUIDO';
}

export default function RelatorioVisita() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: atendimento, isLoading, isError } = useQuery({
    queryKey: ['relatorio-visita', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimentos')
        .select('*, responsavel:responsaveis(nome)')
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
        .select('id, foto_url, tipo')
        .eq('atendimento_id', id)
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as SavedPhoto[];
    },
  });

  const report = useMemo(() => {
    if (!atendimento || !isConformityVisitMode(atendimento.modo)) return null;
    const data = (atendimento.dados_modalidade ?? {}) as Record<string, unknown>;
    return atendimento.modo === 'obras'
      ? buildWorksConformityReport(data as AcompanhamentoObraData)
      : buildEnvironmentalConformityReport(data as AcompanhamentoAmbientalData);
  }, [atendimento]);

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

  if (!report) {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <div className="max-w-sm text-center space-y-4">
          <FileWarning className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Relatório indisponível</h1>
          <p className="text-sm text-muted-foreground">O relatório de conformidade está disponível para visitas de Obras e Ambiental.</p>
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
  const start = atendimento.data_inicio ?? atendimento.created_at;
  const end = atendimento.data_fim;
  const shareUrl = window.location.href;

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
                <p className="mt-1 text-sm text-muted-foreground">Relatório digital de conformidade</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <DetailRow icon={Building2} label="Cliente" value={allClientNames.join(', ') || 'Não informado'} />
                <DetailRow icon={UserRound} label="Responsável técnico" value={atendimento.responsavel?.nome || 'Não informado'} />
                <DetailRow icon={CalendarDays} label="Início" value={formatDate(start)} />
                <DetailRow icon={Clock3} label="Duração" value={formatDuration(start, end)} />
              </div>
            </div>
            <div className="min-w-[178px] border-l-4 border-primary bg-primary/5 px-5 py-4 text-center">
              <p className="text-xs font-medium uppercase text-muted-foreground">Conformidade geral</p>
              <Percentage value={report.percentage} className="block pt-1 text-5xl text-primary" />
              <p className="mt-1 text-xs text-muted-foreground">N/A não entra no cálculo</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Conformidade por módulo</h2>
            <span className="text-xs text-muted-foreground">{report.modules.length} módulos</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {report.modules.map((module) => <ModuleCard key={module.id} module={module} />)}
          </div>
        </section>

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

        <section className="space-y-3">
          <div className="flex items-center gap-2"><Image className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Galeria da visita</h2><span className="text-sm text-muted-foreground">({fotos.length})</span></div>
          {fotos.length === 0 ? <div className="border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Nenhuma foto foi vinculada a esta visita.</div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{fotos.map((foto, index) => <figure key={foto.id} className="overflow-hidden border bg-card"><img src={foto.foto_url} alt={`Foto ${index + 1} da visita`} className="aspect-square h-full w-full object-cover" loading="lazy" /><figcaption className="px-2 py-1.5 text-xs text-muted-foreground">{foto.tipo === 'inicial' ? 'Foto inicial' : foto.tipo === 'final' ? 'Foto final' : 'Registro da visita'}</figcaption></figure>)}</div>}
        </section>
      </main>
    </div>
  );
}
