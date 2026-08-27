import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MobileFilterDrawer } from '@/components/layout/MobileFilterDrawer';
import { 
  Search, Eye, ChevronLeft, ChevronRight, X, Calendar, User, Copy, FileText, Sparkles,
  ArrowUpDown, BarChart3, Pencil
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  buildEnvironmentalConformityReport,
  buildWorksConformityReport,
  isConformityVisitMode,
} from '@/lib/conformityReport';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;
const PERIOD_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: '7d', label: 'Última semana' },
  { value: '30d', label: 'Últimos 30 dias' },
] as const;

const MODE_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'completa', label: 'Atendimento' },
  { value: 'rapida', label: 'Rápida' },
  { value: 'obras', label: 'Obras' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'processos', label: 'Processos' },
] as const;

type SortKey = 'data' | 'titulo' | 'cliente' | 'responsavel' | 'modo' | 'status' | 'duracao';
type SortDir = 'asc' | 'desc';

function getVisitClients(atendimento: any) {
  const related = (atendimento.atendimento_clientes ?? [])
    .map((row: any) => row.clientes?.nome || row.cliente?.nome)
    .filter(Boolean);
  const names = [...new Set([
    ...related,
    atendimento.cliente?.nome,
    atendimento.dados_modalidade?.cliente_nome,
  ].filter(Boolean))];
  return names;
}

function getVisitClientIds(atendimento: any) {
  return [...new Set([
    ...(atendimento.atendimento_clientes ?? []).map((row: any) => row.cliente_id).filter(Boolean),
    atendimento.cliente?.id,
    atendimento.cliente_id,
    atendimento.dados_modalidade?.cliente_id,
  ].filter(Boolean))];
}

function getModeLabel(modo?: string | null) {
  if (modo === 'obras') return 'Obras';
  if (modo === 'ambiental') return 'Ambiental';
  if (modo === 'processos') return 'Processos';
  if (modo === 'rapida') return 'Rápida';
  return 'Atendimento';
}

function getModeBadgeClass(modo?: string | null) {
  if (modo === 'obras') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (modo === 'ambiental') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (modo === 'processos') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (modo === 'rapida') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function getNaturezaForMode(modo?: string | null) {
  if (modo === 'obras') return 'OBRAS';
  if (modo === 'ambiental') return 'AMBIENTAL';
  if (modo === 'processos') return 'PROCESSOS';
  return 'ATENDIMENTO';
}

function getDefaultModalidadeData(modo: string, clienteIds: string[], clientes: any[] = [], previousData: any = null) {
  const primaryId = clienteIds[0] ?? '';
  const primaryName = clientes.find((cliente) => cliente.id === primaryId)?.nome ?? '';

  if (modo === 'obras') {
    return {
      cliente_id: primaryId,
      cliente_nome: primaryName,
      obra_nome: previousData?.obra_nome ?? '',
      obra_existente: true,
      status_geral: '',
      fase_atual: '',
      houve_avanco: 'NAO_SE_APLICA',
      dentro_do_previsto: 'NAO_SE_APLICA',
      percentual_avanco: 0,
      percentual_avanco_faixa: '0-25%',
      pendencias_resolvidas: 'NAO_SE_APLICA',
      controle_ambiental: {},
      organizacao_seguranca: {},
      residuos: {},
      efluentes: {},
      nao_conformidades: [],
      pendencias: [],
      foto_itens: [],
    };
  }

  if (modo === 'ambiental') {
    return {
      cliente_id: primaryId,
      cliente_nome: primaryName,
      motivo_visita: 'VISITA_TECNICA',
      politica_ambiental: 'NAO_SE_APLICA',
      coleta_residuos: 'NAO_SE_APLICA',
      gerenciamento_residuos: 'NAO_SE_APLICA',
      uso_lixeiras: 'NAO_SE_APLICA',
      ete: {},
      agua: {},
      alteracao_funcionarios: 'NAO_SE_APLICA',
      alteracao_producao: 'NAO_SE_APLICA',
      levantamentos: [],
      colaborador_nome: '',
      condicoes_operacionais: {},
      nao_conformidades: [],
      pendencias: [],
      foto_itens: [],
    };
  }

  if (modo === 'processos') {
    return {
      cliente_id: primaryId,
      cliente_nome: primaryName,
      cliente_ids: clienteIds,
      orgao_ids: [],
      processo_ids: [],
      foto_itens: [],
    };
  }

  return null;
}

function normalizeModalidadeData(modo: string, clienteIds: string[], clientes: any[] = [], previousData: any = null) {
  const primaryId = clienteIds[0] ?? '';
  const primaryName = clientes.find((cliente) => cliente.id === primaryId)?.nome ?? previousData?.cliente_nome ?? '';

  if (modo === 'obras' || modo === 'ambiental') {
    return {
      ...(previousData ?? getDefaultModalidadeData(modo, clienteIds, clientes)),
      cliente_id: primaryId,
      cliente_nome: primaryName,
    };
  }

  if (modo === 'processos') {
    return {
      ...(previousData ?? getDefaultModalidadeData(modo, clienteIds, clientes)),
      cliente_id: primaryId,
      cliente_nome: primaryName,
      cliente_ids: clienteIds,
    };
  }

  return null;
}

function getVisitDate(atendimento: any) {
  return new Date(atendimento.data_inicio ?? atendimento.created_at);
}

function getDurationMinutes(atendimento: any) {
  const startValue = atendimento.data_inicio ?? atendimento.created_at;
  const endValue = atendimento.data_fim;
  if (!startValue || !endValue) return null;

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

function getDurationLabel(atendimento: any) {
  const minutes = getDurationMinutes(atendimento);
  if (minutes === null) return null;
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

function getConformityPercentage(atendimento: any) {
  if (!isConformityVisitMode(atendimento.modo) || !atendimento.dados_modalidade) return null;
  const summary = atendimento.modo === 'obras'
    ? buildWorksConformityReport(atendimento.dados_modalidade)
    : buildEnvironmentalConformityReport(atendimento.dados_modalidade);
  return summary.percentage;
}

function compareValues(a: unknown, b: unknown) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a ?? '').localeCompare(String(b ?? ''), 'pt-BR', { sensitivity: 'base', numeric: true });
}

export default function DesktopHistorico() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('data');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [editingVisit, setEditingVisit] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMode, setEditMode] = useState('completa');
  const [editClientIds, setEditClientIds] = useState<string[]>([]);

  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ['desktop-historico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome), atendimento_clientes(cliente_id, clientes(id, nome))`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: responsaveis } = useQuery({
    queryKey: ['responsaveis-filter'],
    queryFn: async () => {
      const { data, error } = await supabase.from('responsaveis').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingVisit) return;

      const previousMode = editingVisit.modo || 'completa';
      const nextMode = editMode || 'completa';
      const modeChanged = previousMode !== nextMode;
      const safeClientIds = [...new Set(editClientIds.filter(Boolean))];
      const previousData = editingVisit.dados_modalidade as any;
      const dadosModalidade = modeChanged
        ? getDefaultModalidadeData(nextMode, safeClientIds, clientes ?? [], previousData)
        : normalizeModalidadeData(nextMode, safeClientIds, clientes ?? [], previousData);

      const payload: Record<string, any> = {
        titulo: editTitle.trim() || null,
        modo: nextMode,
        natureza: getNaturezaForMode(nextMode),
        cliente_id: safeClientIds[0] ?? null,
        dados_modalidade: dadosModalidade,
      };

      if (modeChanged) {
        payload.tipos_atendimento = [];
        payload.acoes_especificas = [];
      }

      const { error: updateError } = await supabase
        .from('atendimentos')
        .update(payload)
        .eq('id', editingVisit.id);
      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('atendimento_clientes')
        .delete()
        .eq('atendimento_id', editingVisit.id);
      if (deleteError) throw deleteError;

      if (safeClientIds.length > 0) {
        const rows = safeClientIds.map((cliente_id) => ({
          atendimento_id: editingVisit.id,
          cliente_id,
        }));
        const { error: insertError } = await supabase
          .from('atendimento_clientes')
          .insert(rows);
        if (insertError) throw insertError;
      }
    },
    onSuccess: async () => {
      toast.success('Visita atualizada');
      setEditingVisit(null);
      await queryClient.invalidateQueries({ queryKey: ['desktop-historico'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível atualizar a visita');
    },
  });

  const filteredAtendimentos = useMemo(() => {
    const filtered = atendimentos?.filter(a => {
    if (search) {
      const s = search.toLowerCase();
      const clientNames = getVisitClients(a).join(' ').toLowerCase();
      const m0 = a.titulo?.toLowerCase().includes(s);
      const m1 = clientNames.includes(s);
      const m2 = a.responsavel?.nome?.toLowerCase().includes(s);
      const m3 = a.tipos_atendimento?.some((t: string) => t.toLowerCase().includes(s));
      const m4 = (a.dados_modalidade as any)?.obra_nome?.toLowerCase?.().includes(s);
      if (!m0 && !m1 && !m2 && !m3 && !m4) return false;
    }
    if (periodFilter !== 'all') {
      const visitDate = new Date(a.created_at);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - (periodFilter === '7d' ? 7 : 30));
      if (visitDate < threshold) return false;
    }
    if (modeFilter !== 'all') {
      const modo = a.modo || 'completa';
      if (modeFilter === 'completa' && modo !== 'completa' && modo !== 'atendimento') return false;
      if (modeFilter !== 'completa' && modo !== modeFilter) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'finalizado' && !a.finalizado) return false;
      if (statusFilter === 'pendente' && a.finalizado) return false;
    }
    if (clienteFilter !== 'all' && !getVisitClientIds(a).includes(clienteFilter)) return false;
    if (responsavelFilter !== 'all' && a.responsavel?.id !== responsavelFilter) return false;
    return true;
  }) || [];

    return [...filtered].sort((left, right) => {
      const valueFor = (item: any) => {
        if (sortKey === 'data') return getVisitDate(item).getTime();
        if (sortKey === 'titulo') return item.titulo || '';
        if (sortKey === 'cliente') return getVisitClients(item).join(', ');
        if (sortKey === 'responsavel') return item.responsavel?.nome || '';
        if (sortKey === 'modo') return getModeLabel(item.modo);
        if (sortKey === 'status') return item.finalizado ? 'Finalizado' : 'Pendente';
        if (sortKey === 'duracao') return getDurationMinutes(item) ?? -1;
        return '';
      };
      const compared = compareValues(valueFor(left), valueFor(right));
      return sortDir === 'asc' ? compared : -compared;
    });
  }, [atendimentos, clienteFilter, modeFilter, periodFilter, responsavelFilter, search, sortDir, sortKey, statusFilter]);

  const totalPages = Math.ceil(filteredAtendimentos.length / ITEMS_PER_PAGE);
  const paginatedAtendimentos = filteredAtendimentos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setClienteFilter('all');
    setResponsavelFilter('all');
    setPeriodFilter('all');
    setModeFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || clienteFilter !== 'all' || responsavelFilter !== 'all' || periodFilter !== 'all' || modeFilter !== 'all';
  const activeFiltersCount = [statusFilter !== 'all', clienteFilter !== 'all', responsavelFilter !== 'all', periodFilter !== 'all', modeFilter !== 'all'].filter(Boolean).length;

  const stats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const durations = filteredAtendimentos
      .map(getDurationMinutes)
      .filter((value): value is number => value !== null);
    const longest = filteredAtendimentos.reduce<any | null>((current, visit) => {
      const duration = getDurationMinutes(visit) ?? -1;
      const currentDuration = current ? getDurationMinutes(current) ?? -1 : -1;
      return duration > currentDuration ? visit : current;
    }, null);
    const average = durations.length
      ? Math.round(durations.reduce((total, value) => total + value, 0) / durations.length)
      : null;

    return {
      week: filteredAtendimentos.filter((visit) => getVisitDate(visit) >= sevenDaysAgo).length,
      month: filteredAtendimentos.filter((visit) => getVisitDate(visit) >= thirtyDaysAgo).length,
      year: filteredAtendimentos.filter((visit) => getVisitDate(visit).getFullYear() === now.getFullYear()).length,
      averageLabel: average === null ? '—' : getDurationLabel({ data_inicio: new Date(0), data_fim: new Date(average * 60000) }),
      longestLabel: longest ? getDurationLabel(longest) : '—',
      longestTitle: longest?.titulo || getVisitClients(longest ?? {})[0] || 'Sem visita',
    };
  }, [filteredAtendimentos]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'data' ? 'desc' : 'asc');
    }
  };

  const SortableHead = ({ label, column, className = '' }: { label: string; column: SortKey; className?: string }) => (
    <TableHead className={className}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1 px-2 text-xs font-semibold"
        onClick={() => toggleSort(column)}
      >
        {label}
        <ArrowUpDown className={`h-3.5 w-3.5 ${sortKey === column ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
    </TableHead>
  );

  const openEditDialog = (visit: any) => {
    setEditingVisit(visit);
    setEditTitle(visit.titulo ?? '');
    setEditMode(visit.modo || 'completa');
    setEditClientIds(getVisitClientIds(visit));
  };

  const toggleEditClient = (id: string) => {
    setEditClientIds((current) => current.includes(id)
      ? current.filter((clientId) => clientId !== id)
      : [...current, id]);
  };

  const copyReportLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/relatorio/visita/${id}`);
      toast.success('Link do relatório copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const quickButtonClass = (active: boolean) =>
    active
      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
      : 'bg-card hover:bg-muted';

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Período</label>
        <div className="flex flex-wrap gap-2">
          {PERIOD_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant="outline"
              size="sm"
              className={quickButtonClass(periodFilter === filter.value)}
              onClick={() => { setPeriodFilter(filter.value); setCurrentPage(1); }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipo de levantamento</label>
        <div className="flex flex-wrap gap-2">
          {MODE_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              variant="outline"
              size="sm"
              className={quickButtonClass(modeFilter === filter.value)}
              onClick={() => { setModeFilter(filter.value); setCurrentPage(1); }}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Cliente</label>
        <Select value={clienteFilter} onValueChange={(v) => { setClienteFilter(v); setCurrentPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Responsável</label>
        <Select value={responsavelFilter} onValueChange={(v) => { setResponsavelFilter(v); setCurrentPage(1); }}>
          <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {responsaveis?.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Responsáveis rápidos</label>
        <div className="flex flex-wrap gap-2">
          {responsaveis?.map((responsavel) => (
            <Button
              key={responsavel.id}
              type="button"
              variant="outline"
              size="sm"
              className={quickButtonClass(responsavelFilter === responsavel.id)}
              onClick={() => {
                setResponsavelFilter(responsavelFilter === responsavel.id ? 'all' : responsavel.id);
                setCurrentPage(1);
              }}
            >
              {responsavel.nome}
            </Button>
          ))}
        </div>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-2">
          <X className="h-4 w-4" /> Limpar Filtros
        </Button>
      )}
    </div>
  );

  return (
    <DesktopLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Search + Filters */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9"
            />
          </div>

          {isMobile ? (
            <MobileFilterDrawer open={filtersOpen} onOpenChange={setFiltersOpen} activeCount={activeFiltersCount}>
              <FilterContent />
            </MobileFilterDrawer>
          ) : (
            <>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={clienteFilter} onValueChange={(v) => { setClienteFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Clientes</SelectItem>
                  {clientes?.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={responsavelFilter} onValueChange={(v) => { setResponsavelFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Responsáveis</SelectItem>
                  {responsaveis?.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} size="sm"><X className="h-4 w-4" /></Button>
              )}
            </>
          )}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-2 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              {PERIOD_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant="outline"
                  size="sm"
                  className={`h-8 shrink-0 text-xs ${quickButtonClass(periodFilter === filter.value)}`}
                  onClick={() => { setPeriodFilter(filter.value); setCurrentPage(1); }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
              {MODE_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant="outline"
                  size="sm"
                  className={`h-8 shrink-0 text-xs ${quickButtonClass(modeFilter === filter.value)}`}
                  onClick={() => { setModeFilter(filter.value); setCurrentPage(1); }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            {!!responsaveis?.length && (
              <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 shrink-0 text-xs ${quickButtonClass(responsavelFilter === 'all')}`}
                  onClick={() => { setResponsavelFilter('all'); setCurrentPage(1); }}
                >
                  Todos responsáveis
                </Button>
                {responsaveis.map((responsavel) => (
                  <Button
                    key={responsavel.id}
                    variant="outline"
                    size="sm"
                    className={`h-8 shrink-0 text-xs ${quickButtonClass(responsavelFilter === responsavel.id)}`}
                    onClick={() => { setResponsavelFilter(responsavel.id); setCurrentPage(1); }}
                  >
                    {responsavel.nome}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-2">
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Semana</p>
              <p className="text-sm font-semibold">{stats.week}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">30 dias</p>
              <p className="text-sm font-semibold">{stats.month}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Ano</p>
              <p className="text-sm font-semibold">{stats.year}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Tempo médio</p>
              <p className="text-sm font-semibold">{stats.averageLabel}</p>
            </div>
            <div className="rounded-lg border bg-card px-3 py-2 sm:col-span-1 xl:col-span-2">
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><BarChart3 className="h-3 w-3" /> Maior duração</p>
              <p className="truncate text-sm font-semibold">{stats.longestLabel}</p>
              <p className="truncate text-[10px] text-muted-foreground">{stats.longestTitle}</p>
            </div>
          </div>
        </div>

        {/* Count */}
        <p className="text-xs text-muted-foreground">
          {filteredAtendimentos.length} resultado{filteredAtendimentos.length !== 1 ? 's' : ''}
        </p>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : paginatedAtendimentos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum atendimento encontrado</div>
        ) : isMobile ? (
          <div className="space-y-2">
            {paginatedAtendimentos.map((a) => {
              const clientNames = getVisitClients(a);
              const conformity = getConformityPercentage(a);
              const durationLabel = getDurationLabel(a);
              return (
              <Card 
                key={a.id}
                className="active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => navigate(`/desktop/atendimento/${a.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(getVisitDate(a), 'dd/MM/yy HH:mm')} · {format(getVisitDate(a), 'EEE', { locale: ptBR })}
                    </div>
                    {a.finalizado ? (
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5 px-1.5">Finalizado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">Pendente</Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{a.titulo || clientNames[0] || 'Atendimento'}</p>
                  {clientNames.length > 0 && (
                    <p className="text-xs font-semibold text-emerald-700 truncate">
                      {clientNames.join(', ')}
                    </p>
                  )}
                  {(a.dados_modalidade as any)?.obra_nome && <p className="text-xs text-muted-foreground truncate">{(a.dados_modalidade as any).obra_nome}</p>}
                  {a.responsavel?.nome && (
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700 mt-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{a.responsavel.nome}</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getModeBadgeClass(a.modo)}`}>{getModeLabel(a.modo)}</Badge>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Tipos: {a.tipos_atendimento?.length ?? 0}</Badge>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Ações: {a.acoes_especificas?.length ?? 0}</Badge>
                    {durationLabel && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[10px] h-5 px-1.5">Duração: {durationLabel}</Badge>
                    )}
                    {conformity !== null && (
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5 px-1.5">Conformidade: {conformity}%</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(a)} title="Editar visita"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => navigate(`/relatorio/visita/${a.id}`)}><FileText className="h-3.5 w-3.5" />Ver relatório</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyReportLink(a.id)} title="Copiar link"><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/relatorio/visita/${a.id}?editar=1`)} title="Editar resumo"><Sparkles className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Data" column="data" />
                  <SortableHead label="Título" column="titulo" />
                  <SortableHead label="Cliente" column="cliente" />
                  <SortableHead label="Responsável" column="responsavel" />
                  <SortableHead label="Tipos" column="modo" />
                  <SortableHead label="Status" column="status" />
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAtendimentos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{format(getVisitDate(a), 'dd/MM/yyyy')}</div>
                      <div className="text-xs capitalize text-muted-foreground">{format(getVisitDate(a), 'EEEE', { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">{format(getVisitDate(a), 'HH:mm')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.titulo || '—'}</div>
                      {(a.dados_modalidade as any)?.obra_nome && <div className="text-xs text-muted-foreground">{(a.dados_modalidade as any).obra_nome}</div>}
                    </TableCell>
                    <TableCell><span className="font-medium text-emerald-700">{getVisitClients(a).join(', ') || '—'}</span></TableCell>
                    <TableCell><span className="font-medium text-blue-700">{a.responsavel?.nome || '—'}</span></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className={`text-xs ${getModeBadgeClass(a.modo)}`}>{getModeLabel(a.modo)}</Badge>
                        <Badge variant="secondary" className="text-xs">Tipos: {a.tipos_atendimento?.length ?? 0}</Badge>
                        <Badge variant="secondary" className="text-xs">Ações: {a.acoes_especificas?.length ?? 0}</Badge>
                        {getDurationLabel(a) && (
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">Duração: {getDurationLabel(a)}</Badge>
                        )}
                        {getConformityPercentage(a) !== null && (
                          <Badge className="bg-primary/10 text-primary text-xs">Conformidade: {getConformityPercentage(a)}%</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.finalizado 
                        ? <Badge className="bg-primary/10 text-primary">Finalizado</Badge>
                        : <Badge variant="outline">Pendente</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar visita" onClick={() => openEditDialog(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Ver relatório" onClick={() => navigate(`/relatorio/visita/${a.id}`)}><FileText className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Copiar link do relatório" onClick={() => copyReportLink(a.id)}><Copy className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Editar resumo com IA" onClick={() => navigate(`/relatorio/visita/${a.id}?editar=1`)}><Sparkles className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Ver detalhes" onClick={() => navigate(`/desktop/atendimento/${a.id}`)}><Eye className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{currentPage}/{totalPages}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Dialog open={!!editingVisit} onOpenChange={(open) => !open && setEditingVisit(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar visita</DialogTitle>
              <DialogDescription>
                Ajuste título, clientes e modalidade. Ao trocar a modalidade, tipos e ações são limpos para evitar classificação incorreta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Ex.: Visita técnica - acompanhamento da ETE"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Modalidade</label>
                <Select value={editMode} onValueChange={setEditMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completa">Atendimento</SelectItem>
                    <SelectItem value="rapida">Rápida</SelectItem>
                    <SelectItem value="obras">Acompanhamento de Obras</SelectItem>
                    <SelectItem value="ambiental">Acompanhamento Ambiental</SelectItem>
                    <SelectItem value="processos">Acompanhamento de Processos</SelectItem>
                  </SelectContent>
                </Select>
                {editingVisit && (editingVisit.modo || 'completa') !== editMode && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    A troca de modalidade vai preservar datas, fotos, demandas, comentários e resumo, mas limpar tipos de atendimento, ações e questionário específico.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Clientes vinculados</label>
                <div className="grid max-h-64 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-2">
                  {clientes?.map((cliente) => (
                    <label key={cliente.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                      <Checkbox
                        checked={editClientIds.includes(cliente.id)}
                        onCheckedChange={() => toggleEditClient(cliente.id)}
                      />
                      <span className="min-w-0 truncate">{cliente.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingVisit(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DesktopLayout>
  );
}
