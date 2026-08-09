import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MobileFilterDrawer } from '@/components/layout/MobileFilterDrawer';
import { 
  Search, Eye, ChevronLeft, ChevronRight, X, Calendar, User
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const ITEMS_PER_PAGE = 10;

export default function DesktopHistorico() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clienteFilter, setClienteFilter] = useState<string>('all');
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ['desktop-historico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome)`)
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

  const filteredAtendimentos = atendimentos?.filter(a => {
    if (search) {
      const s = search.toLowerCase();
      const m0 = a.titulo?.toLowerCase().includes(s);
      const m1 = a.cliente?.nome?.toLowerCase().includes(s);
      const m2 = a.responsavel?.nome?.toLowerCase().includes(s);
      const m3 = a.tipos_atendimento?.some((t: string) => t.toLowerCase().includes(s));
      const m4 = (a.dados_modalidade as any)?.obra_nome?.toLowerCase?.().includes(s);
      if (!m0 && !m1 && !m2 && !m3 && !m4) return false;
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'finalizado' && !a.finalizado) return false;
      if (statusFilter === 'pendente' && a.finalizado) return false;
    }
    if (clienteFilter !== 'all' && a.cliente?.id !== clienteFilter) return false;
    if (responsavelFilter !== 'all' && a.responsavel?.id !== responsavelFilter) return false;
    return true;
  }) || [];

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
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || clienteFilter !== 'all' || responsavelFilter !== 'all';
  const activeFiltersCount = [statusFilter !== 'all', clienteFilter !== 'all', responsavelFilter !== 'all'].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-4">
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
            {paginatedAtendimentos.map((a) => (
              <Card 
                key={a.id}
                className="active:scale-[0.99] transition-transform cursor-pointer"
                onClick={() => navigate(`/desktop/atendimento/${a.id}`)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(a.created_at), 'dd/MM/yy HH:mm')}
                    </div>
                    {a.finalizado ? (
                      <Badge className="bg-primary/10 text-primary text-[10px] h-5 px-1.5">Finalizado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">Pendente</Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{a.titulo || a.cliente?.nome || 'Atendimento'}</p>
                  {a.cliente?.nome && <p className="text-xs text-muted-foreground truncate">{a.cliente.nome}</p>}
                  {(a.dados_modalidade as any)?.obra_nome && <p className="text-xs text-muted-foreground truncate">{(a.dados_modalidade as any).obra_nome}</p>}
                  {a.responsavel?.nome && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{a.responsavel.nome}</span>
                    </div>
                  )}
                  {a.tipos_atendimento?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.tipos_atendimento.slice(0, 2).map((tipo: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5">{tipo}</Badge>
                      ))}
                      {a.tipos_atendimento.length > 2 && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{a.tipos_atendimento.length - 2}</Badge>
                      )}
                    </div>
                  )}
                  {a.modo && a.modo !== 'completa' && <Badge variant="outline" className="text-[10px] h-5 px-1.5 mt-2">{a.modo === 'obras' ? 'Obras' : a.modo === 'ambiental' ? 'Ambiental' : 'Rápida'}</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Tipos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAtendimentos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{format(new Date(a.created_at), 'dd/MM/yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'HH:mm')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.titulo || '—'}</div>
                      {(a.dados_modalidade as any)?.obra_nome && <div className="text-xs text-muted-foreground">{(a.dados_modalidade as any).obra_nome}</div>}
                    </TableCell>
                    <TableCell>{a.cliente?.nome || '—'}</TableCell>
                    <TableCell>{a.responsavel?.nome || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {a.modo && a.modo !== 'completa' && <Badge variant="outline" className="text-xs">{a.modo === 'obras' ? 'Obras' : a.modo === 'ambiental' ? 'Ambiental' : 'Rápida'}</Badge>}
                        {a.tipos_atendimento?.slice(0, 2).map((tipo: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tipo}</Badge>
                        ))}
                        {a.tipos_atendimento?.length > 2 && <Badge variant="outline" className="text-xs">+{a.tipos_atendimento.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.finalizado 
                        ? <Badge className="bg-primary/10 text-primary">Finalizado</Badge>
                        : <Badge variant="outline">Pendente</Badge>
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/desktop/atendimento/${a.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
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
      </div>
    </DesktopLayout>
  );
}
