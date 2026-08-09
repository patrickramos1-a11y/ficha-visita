import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CalendarDays, CheckCircle2, ExternalLink, Landmark, Link2, Loader2, Plus, Send, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;
const natureLabels: Record<string, string> = { ATENDIMENTO: 'Atendimento', OBRAS: 'Acompanhamento de Obras', AMBIENTAL: 'Acompanhamento Ambiental', PROCESSOS: 'Acompanhamento de Processos' };
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

function useOptionalTable(table: string, queryKey: string) {
  return useQuery({ queryKey: [queryKey], retry: false, queryFn: async () => { const { data, error } = await db.from(table).select('*').order('nome'); if (error) return []; return data ?? []; } });
}

export default function Gestao() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [tab, setTab] = useState('visao');
  const [newNature, setNewNature] = useState('');
  const [newOrgao, setNewOrgao] = useState('');
  const [newProcesso, setNewProcesso] = useState('');
  const [processoCliente, setProcessoCliente] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const { data: visitas = [], isLoading } = useQuery({ queryKey: ['gestao-visitas'], queryFn: async () => { const { data, error } = await db.from('atendimentos').select('*, atendimento_clientes(cliente_id, clientes(id,nome))').eq('finalizado', true).order('data_inicio', { ascending: false }); if (error) throw error; return data ?? []; } });
  const { data: clientes = [] } = useQuery({ queryKey: ['gestao-clientes'], queryFn: async () => { const { data, error } = await db.from('clientes').select('*').order('nome'); if (error) throw error; return data ?? []; } });
  const { data: responsaveis = [] } = useQuery({ queryKey: ['gestao-responsaveis'], queryFn: async () => { const { data, error } = await db.from('responsaveis').select('id,nome').order('nome'); return error ? [] : data ?? []; } });
  const { data: demandas = [] } = useQuery({ queryKey: ['gestao-demandas'], queryFn: async () => { const { data, error } = await db.from('demandas').select('*'); return error ? [] : data ?? []; } });
  const { data: naturezas = [] } = useOptionalTable('naturezas_visita', 'gestao-naturezas');
  const { data: orgaos = [] } = useOptionalTable('orgaos', 'gestao-orgaos');
  const { data: processos = [] } = useOptionalTable('processos_clientes', 'gestao-processos');
  const { data: exportados = [] } = useQuery({ queryKey: ['gestao-exportados'], retry: false, queryFn: async () => { const { data, error } = await db.from('integracao_radar_itens').select('*'); return error ? [] : data ?? []; } });

  const visitsWithItems = useMemo(() => visitas.map((visit: any) => ({ ...visit, demandas: demandas.filter((item: any) => item.atendimento_id === visit.id) })), [visitas, demandas]);
  const yearVisits = useMemo(() => visitsWithItems.filter((visit: any) => new Date(visit.data_inicio ?? visit.created_at).getFullYear() === Number(year)), [visitsWithItems, year]);
  const monthly = useMemo(() => Array.from({ length: 12 }, (_, index) => ({ mes: monthFormatter.format(new Date(Number(year), index, 1)).replace('.', ''), visitas: yearVisits.filter((visit: any) => new Date(visit.data_inicio ?? visit.created_at).getMonth() === index).length })), [year, yearVisits]);
  const natureCounts = useMemo(() => Object.entries(natureLabels).map(([codigo, nome]) => ({ codigo, nome, total: yearVisits.filter((visit: any) => (visit.natureza || (visit.modo === 'obras' ? 'OBRAS' : visit.modo === 'ambiental' ? 'AMBIENTAL' : visit.modo === 'processos' ? 'PROCESSOS' : 'ATENDIMENTO')) === codigo).length })), [yearVisits]);
  const clientRows = useMemo(() => clientes.map((cliente: any) => { const related = yearVisits.filter((visit: any) => (visit.atendimento_clientes ?? []).some((row: any) => row.cliente_id === cliente.id) || visit.cliente_id === cliente.id || visit.dados_modalidade?.cliente_id === cliente.id); const tipos = [...new Set(related.flatMap((visit: any) => visit.tipos_atendimento ?? []))]; const acoes = [...new Set(related.flatMap((visit: any) => visit.acoes_especificas ?? []))]; return { cliente, related, tipos, acoes }; }).filter(row => row.related.length > 0), [clientes, yearVisits]);
  const pendingVisits = useMemo(() => yearVisits.filter((visit: any) => { const demands = (visit.demandas ?? []).filter((item: any) => item.descricao?.trim()); const notes = visit.anotacoes_itens ?? []; return demands.length + notes.length > 0; }), [yearVisits]);

  const saveNature = async () => { if (!newNature.trim()) return; const code = newNature.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_'); const { error } = await db.from('naturezas_visita').insert({ codigo: code, nome: newNature.trim(), ativo: true }); if (error) return toast.error('Aplique primeiro o SQL da Gestão no Supabase'); setNewNature(''); queryClient.invalidateQueries({ queryKey: ['gestao-naturezas'] }); };
  const saveOrgao = async () => { if (!newOrgao.trim()) return; const { error } = await db.from('orgaos').insert({ nome: newOrgao.trim(), ativo: true }); if (error) return toast.error('Aplique primeiro o SQL da Gestão no Supabase'); setNewOrgao(''); queryClient.invalidateQueries({ queryKey: ['gestao-orgaos'] }); };
  const saveProcesso = async () => { if (!newProcesso.trim() || !processoCliente) return; const { error } = await db.from('processos_clientes').insert({ nome: newProcesso.trim(), cliente_id: processoCliente, ativo: true }); if (error) return toast.error('Aplique primeiro o SQL da Gestão no Supabase'); setNewProcesso(''); queryClient.invalidateQueries({ queryKey: ['gestao-processos'] }); };
  const clientName = (visit: any) => visit.atendimento_clientes?.[0]?.clientes?.nome || clientes.find((client: any) => client.id === visit.cliente_id)?.nome || visit.dados_modalidade?.cliente_nome || 'Cliente não identificado';
  const clientId = (visit: any) => visit.atendimento_clientes?.[0]?.cliente_id || visit.cliente_id || visit.dados_modalidade?.cliente_id;
  const responsavelName = (visit: any) => responsaveis.find((responsavel: any) => responsavel.id === visit.responsavel_id)?.nome || 'Ficha de Visita';
  const isSent = (visit: any) => exportados.some((item: any) => item.atendimento_id === visit.id && item.status === 'ENVIADO');
  const exportItems = (visit: any) => [
    ...(visit.demandas ?? []).filter((item: any) => item.descricao?.trim()).map((item: any) => ({ key: `D:${item.id}`, label: item.descricao, kind: 'DEMANDA' })),
    ...(visit.anotacoes_itens ?? []).filter((item: any) => item.texto?.trim()).map((item: any) => ({ key: `N:${item.id}`, label: item.texto, kind: 'ANOTACAO' })),
  ];
  const selectedKeys = (visit: any) => selection[visit.id] ?? exportItems(visit).map(item => item.key);
  const toggleExportItem = (visit: any, key: string) => setSelection(current => { const selected = selectedKeys(visit); return { ...current, [visit.id]: selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key] }; });
  const sendVisit = async (visit: any) => {
    const selected = selectedKeys(visit);
    const demands = (visit.demandas ?? []).filter((item: any) => item.descricao?.trim() && selected.includes(`D:${item.id}`));
    const notes = (visit.anotacoes_itens ?? []).filter((item: any) => item.texto?.trim() && selected.includes(`N:${item.id}`));
    if (!demands.length && !notes.length) return toast.message('Esta visita não possui itens para enviar.');
    setSending(visit.id);
    try {
      const response = await fetch('/api/radar-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visit: { id: visit.id, title: visit.titulo, date: visit.data_inicio ?? visit.created_at, clientName: clientName(visit), clientId: clientId(visit), responsavelNome: responsavelName(visit) }, demands, notes }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Falha ao enviar ao Radar');
      toast.success(`${payload.created ?? 0} item(ns) enviados ao Radar Vital`);
      queryClient.invalidateQueries({ queryKey: ['gestao-exportados'] });
    } catch (error: any) { toast.error(error.message || 'Não foi possível enviar ao Radar'); } finally { setSending(null); }
  };

  return <DesktopLayout><div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-semibold">Gestão de Visitas</h2><p className="text-sm text-muted-foreground">Indicadores, cadastros e encaminhamentos ao Radar Vital.</p></div><Select value={year} onValueChange={setYear}><SelectTrigger className="w-28"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index)).map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
    <Tabs value={tab} onValueChange={setTab}><TabsList className="h-auto flex-wrap"><TabsTrigger value="visao">Visão geral</TabsTrigger><TabsTrigger value="temporal">Temporal</TabsTrigger><TabsTrigger value="clientes">Clientes</TabsTrigger><TabsTrigger value="naturezas">Naturezas</TabsTrigger><TabsTrigger value="processos">Processos</TabsTrigger><TabsTrigger value="integracoes">Integrações</TabsTrigger></TabsList>
      <TabsContent value="visao" className="space-y-4"><div className="grid gap-4 md:grid-cols-4"><Metric icon={CalendarDays} label="Visitas no ano" value={yearVisits.length} /><Metric icon={Users} label="Clientes atendidos" value={clientRows.length} /><Metric icon={CheckCircle2} label="Ações executadas" value={yearVisits.reduce((total: number, visit: any) => total + (visit.acoes_especificas?.length ?? 0), 0)} /><Metric icon={Send} label="Na fila do Radar" value={pendingVisits.filter(visit => !isSent(visit)).length} /></div><div className="grid gap-4 md:grid-cols-2">{natureCounts.map(item => <Card key={item.codigo}><CardContent className="flex items-center justify-between p-4"><span className="text-sm">{item.nome}</span><strong className="text-xl">{item.total}</strong></CardContent></Card>)}</div></TabsContent>
      <TabsContent value="temporal"><Card><CardHeader><CardTitle className="text-base">Visitas por mês</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid vertical={false} /><XAxis dataKey="mes" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card></TabsContent>
      <TabsContent value="clientes"><Card><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="p-3">Cliente</th><th className="p-3">Visitas</th><th className="p-3">Atendimentos</th><th className="p-3">Ações</th></tr></thead><tbody>{clientRows.map(({ cliente, related, tipos, acoes }) => <tr key={cliente.id} className="border-b last:border-0"><td className="p-3 font-medium">{cliente.nome}</td><td className="p-3">{related.length}</td><td className="p-3">{tipos.join(', ') || '—'}</td><td className="p-3">{acoes.join(', ') || '—'}</td></tr>)}</tbody></table></div></CardContent></Card></TabsContent>
      <TabsContent value="naturezas" className="space-y-4"><Card><CardHeader><CardTitle className="text-base">Naturezas de visita</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input value={newNature} onChange={event => setNewNature(event.target.value)} placeholder="Nova natureza" disabled /><Button type="button" onClick={saveNature} disabled title="As naturezas iniciais são fixas nesta versão"><Plus className="mr-2 h-4 w-4" />Adicionar</Button></div>{(naturezas.length ? naturezas : Object.entries(natureLabels).map(([codigo, nome]) => ({ codigo, nome, ativo: true }))).map((item: any) => <div key={item.codigo} className="flex items-center justify-between border-b py-3"><span>{item.nome}</span><span className="text-xs text-muted-foreground">{item.ativo === false ? 'Inativa' : 'Ativa'}</span></div>)}</CardContent></Card></TabsContent>
      <TabsContent value="processos" className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" />Órgãos</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input value={newOrgao} onChange={event => setNewOrgao(event.target.value)} placeholder="Novo órgão" /><Button type="button" size="icon" onClick={saveOrgao}><Plus className="h-4 w-4" /></Button></div>{orgaos.map((item: any) => <p key={item.id} className="border-b py-2 text-sm">{item.nome}</p>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Processos por cliente</CardTitle></CardHeader><CardContent className="space-y-3"><Select value={processoCliente} onValueChange={setProcessoCliente}><SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger><SelectContent>{clientes.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select><div className="flex gap-2"><Input value={newProcesso} onChange={event => setNewProcesso(event.target.value)} placeholder="Novo processo" /><Button type="button" size="icon" onClick={saveProcesso}><Plus className="h-4 w-4" /></Button></div>{processos.filter((item: any) => !processoCliente || item.cliente_id === processoCliente).map((item: any) => <p key={item.id} className="border-b py-2 text-sm">{item.nome}</p>)}</CardContent></Card></TabsContent>
      <TabsContent value="integracoes" className="space-y-3">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : pendingVisits.map((visit: any) => <Card key={visit.id}><CardContent className="space-y-4 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-medium">{visit.titulo || 'Visita sem título'}</p><p className="text-sm text-muted-foreground">{clientName(visit)} · {new Date(visit.data_inicio ?? visit.created_at).toLocaleDateString('pt-BR')}</p></div><Button onClick={() => sendVisit(visit)} disabled={sending === visit.id || isSent(visit) || selectedKeys(visit).length === 0}>{sending === visit.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSent(visit) ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <ExternalLink className="mr-2 h-4 w-4" />}{isSent(visit) ? 'Itens enviados' : 'Enviar selecionados'}</Button></div>{!isSent(visit) && <div className="space-y-2 border-t pt-3">{exportItems(visit).map(item => <label key={item.key} className="flex cursor-pointer items-start gap-3 text-sm"><Checkbox checked={selectedKeys(visit).includes(item.key)} onCheckedChange={() => toggleExportItem(visit, item.key)} /><span><span className="mr-2 text-xs text-muted-foreground">{item.kind === 'DEMANDA' ? 'Demanda' : 'Anotação'}</span>{item.label}</span></label>)}</div>}</CardContent></Card>)}{!isLoading && pendingVisits.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma demanda ou anotação pendente para envio.</p>}</TabsContent>
    </Tabs></div></DesktopLayout>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div></CardContent></Card>; }
