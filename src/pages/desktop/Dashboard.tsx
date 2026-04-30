import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, eachYearOfInterval, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Users, 
  UserCog, 
  TrendingUp,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  ChevronRight,
  Eye,
  Clock
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const COLORS = ['hsl(var(--primary))', 'hsl(199, 89%, 48%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)'];

type PeriodoFiltro = '7dias' | '30dias' | '3meses' | '6meses' | '12meses' | 'tudo' | string; // string for year like "ano-2024"

export default function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('30dias');
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState<string | null>(null);

  const { data: anosDisponiveis } = useQuery({
    queryKey: ['dashboard-anos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1);
      if (error || !data?.length) return [];
      const firstYear = new Date(data[0].created_at).getFullYear();
      const currentYear = new Date().getFullYear();
      const years: number[] = [];
      for (let y = firstYear; y < currentYear; y++) years.push(y);
      return years;
    },
  });

  const getDateRange = () => {
    const now = new Date();
    if (periodo.startsWith('ano-')) {
      const year = parseInt(periodo.replace('ano-', ''));
      return { start: new Date(year, 0, 1), end: new Date(year, 11, 31, 23, 59, 59) };
    }
    switch (periodo) {
      case '7dias': return { start: subDays(now, 7), end: now };
      case '30dias': return { start: subDays(now, 30), end: now };
      case '3meses': return { start: subMonths(now, 3), end: now };
      case '6meses': return { start: subMonths(now, 6), end: now };
      case '12meses': return { start: subMonths(now, 12), end: now };
      case 'tudo': return { start: new Date(2020, 0, 1), end: now };
      default: return { start: subDays(now, 30), end: now };
    }
  };

  const dateRange = getDateRange();

  const { data: atendimentos, isLoading: loadingAtendimentos, refetch } = useQuery({
    queryKey: ['dashboard-atendimentos', periodo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome)`)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes } = useQuery({
    queryKey: ['clientes-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('id, nome').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const { data: responsaveis } = useQuery({
    queryKey: ['responsaveis-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('responsaveis').select('id, nome').eq('ativo', true).order('nome');
      if (error) throw error;
      return data;
    },
  });

  const filteredAtendimentos = atendimentos?.filter(a => {
    if (clienteSelecionado && a.cliente?.id !== clienteSelecionado) return false;
    if (responsavelSelecionado && a.responsavel?.id !== responsavelSelecionado) return false;
    return true;
  }) || [];

  const totalAtendimentos = filteredAtendimentos.length;
  const finalizados = filteredAtendimentos.filter(a => a.finalizado).length;
  const emAndamento = totalAtendimentos - finalizados;
  
  const previousPeriodAtendimentos = atendimentos?.length || 0;
  const growthPercentage = previousPeriodAtendimentos > 0 
    ? Math.round(((totalAtendimentos - previousPeriodAtendimentos) / previousPeriodAtendimentos) * 100)
    : 0;

  const getTimeSeriesData = () => {
    const range = getDateRange();

    // "Tudo" -> aggregate by year
    if (periodo === 'tudo') {
      const years = eachYearOfInterval({ start: range.start, end: range.end });
      return years.map(year => {
        const yStart = startOfYear(year);
        const yEnd = endOfYear(year);
        return {
          data: format(year, 'yyyy'),
          atendimentos: filteredAtendimentos.filter(a => {
            const d = new Date(a.created_at);
            return d >= yStart && d <= yEnd;
          }).length,
          finalizados: filteredAtendimentos.filter(a => {
            const d = new Date(a.created_at);
            return d >= yStart && d <= yEnd && a.finalizado;
          }).length,
        };
      });
    }

    // 12 meses or ano-* -> aggregate by month
    const isMonthView = periodo === '12meses' || periodo.startsWith('ano-');
    if (isMonthView) {
      const months = eachMonthOfInterval({ start: range.start, end: range.end });
      return months.map(month => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);
        return {
          data: format(month, isMobile ? 'MMM' : 'MMM/yy', { locale: ptBR }),
          atendimentos: filteredAtendimentos.filter(a => {
            const d = new Date(a.created_at);
            return d >= mStart && d <= mEnd;
          }).length,
          finalizados: filteredAtendimentos.filter(a => {
            const d = new Date(a.created_at);
            return d >= mStart && d <= mEnd && a.finalizado;
          }).length,
        };
      });
    }

    // 7d, 30d, 3m, 6m -> aggregate by day
    const days = eachDayOfInterval({ start: range.start, end: range.end });
    return days.map(date => ({
      data: format(date, isMobile ? 'dd' : 'dd/MM'),
      atendimentos: filteredAtendimentos.filter(a => {
        const aDate = new Date(a.created_at);
        return aDate >= startOfDay(date) && aDate <= endOfDay(date);
      }).length,
      finalizados: filteredAtendimentos.filter(a => {
        const aDate = new Date(a.created_at);
        return aDate >= startOfDay(date) && aDate <= endOfDay(date) && a.finalizado;
      }).length,
    }));
  };

  const atendimentosPorCliente = Object.entries(
    filteredAtendimentos.reduce((acc, a) => {
      const nome = a.cliente?.nome || 'Sem cliente';
      const id = a.cliente?.id || 'sem-cliente';
      if (!acc[id]) acc[id] = { nome, count: 0 };
      acc[id].count += 1;
      return acc;
    }, {} as Record<string, { nome: string; count: number }>)
  )
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, { nome, count }]) => ({ id, nome, count }));

  const atendimentosPorResponsavel = Object.entries(
    filteredAtendimentos.reduce((acc, a) => {
      const nome = a.responsavel?.nome || 'Sem responsável';
      const id = a.responsavel?.id || 'sem-responsavel';
      if (!acc[id]) acc[id] = { nome, value: 0 };
      acc[id].value += 1;
      return acc;
    }, {} as Record<string, { nome: string; value: number }>)
  ).map(([id, { nome, value }]) => ({ id, nome, value }));

  const tiposAtendimento = Object.entries(
    filteredAtendimentos.flatMap(a => a.tipos_atendimento || []).reduce((acc, tipo) => {
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tipo, count]) => ({ tipo, count }));

  const recentAtendimentos = filteredAtendimentos.slice(0, 5);

  const handleClienteClick = (data: any) => {
    if (data?.id) setClienteSelecionado(prev => prev === data.id ? null : data.id);
  };

  const handleResponsavelClick = (data: any) => {
    if (data?.id) setResponsavelSelecionado(prev => prev === data.id ? null : data.id);
  };

  const clearFilters = () => {
    setClienteSelecionado(null);
    setResponsavelSelecionado(null);
  };

  if (loadingAtendimentos) {
    return (
      <DesktopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DesktopLayout>
    );
  }

  return (
    <DesktopLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">Dashboard</h1>
            {!isMobile && (
              <p className="text-sm text-muted-foreground">
                Visão geral e análise interativa
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-[110px] md:w-[130px] h-9">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7dias">7 dias</SelectItem>
                <SelectItem value="30dias">30 dias</SelectItem>
                <SelectItem value="3meses">3 meses</SelectItem>
                <SelectItem value="6meses">6 meses</SelectItem>
                <SelectItem value="12meses">12 meses</SelectItem>
                {anosDisponiveis && anosDisponiveis.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Por ano</div>
                    {anosDisponiveis.map(year => (
                      <SelectItem key={year} value={`ano-${year}`}>{year}</SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="tudo">Tudo</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {(clienteSelecionado || responsavelSelecionado) && (
          <div className="flex flex-wrap items-center gap-2">
            {clienteSelecionado && (
              <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setClienteSelecionado(null)}>
                {clientes?.find(c => c.id === clienteSelecionado)?.nome} ✕
              </Badge>
            )}
            {responsavelSelecionado && (
              <Badge variant="secondary" className="cursor-pointer text-xs" onClick={() => setResponsavelSelecionado(null)}>
                {responsaveis?.find(r => r.id === responsavelSelecionado)?.nome} ✕
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs px-2">
              Limpar
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <KPICard
            label="Visitas totais"
            value={totalAtendimentos}
            icon={FileText}
            iconBg="bg-primary/10"
            iconColor="text-primary"
            sub={
              <div className="flex items-center gap-0.5">
                {growthPercentage >= 0 
                  ? <ArrowUpRight className="h-3 w-3 text-green-500" />
                  : <ArrowDownRight className="h-3 w-3 text-red-500" />
                }
                <span className={`text-[10px] md:text-xs ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(growthPercentage)}%
                </span>
              </div>
            }
          />
          <KPICard label="Finalizados" value={finalizados} icon={CheckCircle2} iconBg="bg-green-500/10" iconColor="text-green-500" valueColor="text-green-600"
            sub={<span className="text-[10px] md:text-xs text-muted-foreground">{totalAtendimentos > 0 ? Math.round((finalizados / totalAtendimentos) * 100) : 0}%</span>}
          />
          <KPICard label="Em Andamento" value={emAndamento} icon={Clock} iconBg="bg-orange-500/10" iconColor="text-orange-500" valueColor="text-orange-600"
            sub={<span className="text-[10px] md:text-xs text-muted-foreground">pendentes</span>}
          />
          <KPICard label="Clientes" value={clientes?.length || 0} icon={Users} iconBg="bg-blue-500/10" iconColor="text-blue-500" onClick={() => navigate('/desktop/clientes')}
            sub={<span className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-0.5">Ver <ChevronRight className="h-3 w-3" /></span>}
          />
        </div>

        {/* Trend Chart */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolução
            </CardTitle>
          </CardHeader>
          <CardContent className="px-1 md:px-6 pb-3 md:pb-6">
            <div className="h-[180px] md:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getTimeSeriesData()}>
                  <defs>
                    <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFinalizados" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(145, 63%, 42%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="data" tick={{ fontSize: isMobile ? 9 : 11 }} interval={
                    periodo === '6meses' ? (isMobile ? 20 : 10) :
                    periodo === '3meses' ? (isMobile ? 10 : 5) :
                    periodo === '30dias' ? (isMobile ? 4 : 2) :
                    isMobile ? 2 : 0
                  } />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={24} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Area type="monotone" dataKey="atendimentos" name="Total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorAtendimentos)" strokeWidth={2} />
                  <Area type="monotone" dataKey="finalizados" name="Finalizados" stroke="hsl(145, 63%, 42%)" fillOpacity={1} fill="url(#colorFinalizados)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Pie - Responsáveis */}
          <Card>
            <CardHeader className="pb-1 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCog className="h-4 w-4 text-primary" />
                Por Responsável
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Toque para filtrar</p>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="h-[160px] md:h-[220px]">
                {atendimentosPorResponsavel.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={atendimentosPorResponsavel} cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" dataKey="value" nameKey="nome" onClick={handleResponsavelClick} style={{ cursor: 'pointer' }}>
                        {atendimentosPorResponsavel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={responsavelSelecionado && responsavelSelecionado !== entry.id ? 0.3 : 1} stroke={responsavelSelecionado === entry.id ? 'hsl(var(--foreground))' : 'transparent'} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} formatter={(value: number, name: string) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Sem dados</div>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {atendimentosPorResponsavel.slice(0, 4).map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-accent p-1 rounded" onClick={() => handleResponsavelClick(item)}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="truncate">{item.nome}</span>
                    </div>
                    <span className="font-medium ml-2">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Clientes */}
          <Card>
            <CardHeader className="pb-1 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Top Clientes
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Toque para filtrar</p>
            </CardHeader>
            <CardContent className="px-1 md:px-6 pb-3 md:pb-6">
              <div className="h-[180px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={atendimentosPorCliente} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 10 }} width={isMobile ? 60 : 80} tickFormatter={(value) => value.length > (isMobile ? 8 : 12) ? `${value.slice(0, isMobile ? 8 : 12)}…` : value} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }} formatter={(value: number) => [value, 'Atendimentos']} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} onClick={handleClienteClick} style={{ cursor: 'pointer' }}>
                      {atendimentosPorCliente.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={clienteSelecionado && clienteSelecionado !== entry.id ? 0.3 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tipos de Atendimento */}
          <Card>
            <CardHeader className="pb-1 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tipos de Atendimento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="space-y-2.5">
                {tiposAtendimento.length > 0 ? (
                  tiposAtendimento.map((item, index) => {
                    const percentage = totalAtendimentos > 0 ? Math.round((item.count / totalAtendimentos) * 100) : 0;
                    return (
                      <div key={item.tipo} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate mr-2">{item.tipo}</span>
                          <span className="font-medium shrink-0">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-muted-foreground py-6 text-sm">Sem dados</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Atividade Recente
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/desktop/historico')} className="text-xs h-7 px-2">
              Ver todos <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            <div className="space-y-1">
              {recentAtendimentos.length > 0 ? (
                recentAtendimentos.map((atendimento) => (
                  <div 
                    key={atendimento.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors touch-safe"
                    onClick={() => navigate(`/desktop/atendimento/${atendimento.id}`)}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${atendimento.finalizado ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{atendimento.cliente?.nome || 'Sem cliente'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {atendimento.responsavel?.nome} • {format(new Date(atendimento.created_at), 'dd/MM HH:mm')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-6 text-sm">Sem atividade recente</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DesktopLayout>
  );
}

// KPI Card component
function KPICard({ label, value, icon: Icon, iconBg, iconColor, valueColor, sub, onClick }: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  sub?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card className={onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""} onClick={onClick}>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-start justify-between mb-1">
          <span className="text-[11px] md:text-xs text-muted-foreground font-medium leading-tight">{label}</span>
          <div className={`h-6 w-6 md:h-8 md:w-8 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
            <Icon className={`h-3 w-3 md:h-4 md:w-4 ${iconColor}`} />
          </div>
        </div>
        <div className={`text-xl md:text-3xl font-bold ${valueColor || ''}`}>{value}</div>
        {sub}
      </CardContent>
    </Card>
  );
}
