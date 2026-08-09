import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MobileFooter } from '@/components/mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { RegistroVisita } from '@/components/visita/RegistroVisita';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const STEPS = ['Identificação', 'Órgãos e processos', 'Registro', 'Revisão'];

export default function AcompanhamentoProcessos() {
  useVisitRoute('/visita/processos');
  const navigate = useNavigate();
  const save = useSaveAtendimento();
  const { data, setResponsavelId, setAcompanhamentoProcessos, finalizarAtendimento } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const { data: responsaveis = [] } = useResponsaveis();
  const [step, setStep] = useState(0);
  const [newOrgao, setNewOrgao] = useState('');
  const [newProcesso, setNewProcesso] = useState('');
  const processo = data.acompanhamento_processos;
  const db = supabase as any;
  const { data: orgaos = [], refetch: refetchOrgaos } = useQuery({ queryKey: ['orgaos-visita'], queryFn: async () => { const { data, error } = await db.from('orgaos').select('*').eq('ativo', true).order('nome'); if (error) throw error; return data ?? []; } });
  const { data: processos = [], refetch: refetchProcessos } = useQuery({ queryKey: ['processos-cliente', processo?.cliente_id], enabled: Boolean(processo?.cliente_id), queryFn: async () => { const { data, error } = await db.from('processos_clientes').select('*').eq('cliente_id', processo!.cliente_id).eq('ativo', true).order('nome'); if (error) throw error; return data ?? []; } });
  const { data: obras = [] } = useQuery({ queryKey: ['obras-processos', processo?.cliente_id], enabled: Boolean(processo?.cliente_id), queryFn: async () => { const { data, error } = await db.from('obras').select('*').eq('cliente_id', processo!.cliente_id).eq('ativo', true).order('nome'); if (error) throw error; return data ?? []; } });
  const selectedOrgaos = useMemo(() => new Set(processo?.orgao_ids ?? []), [processo?.orgao_ids]);
  const selectedProcessos = useMemo(() => new Set(processo?.processo_ids ?? []), [processo?.processo_ids]);
  if (!processo) return null;
  const update = (patch: Partial<typeof processo>) => setAcompanhamentoProcessos(prev => ({ ...prev, ...patch }));
  const toggle = (field: 'orgao_ids' | 'processo_ids', id: string) => update({ [field]: processo[field].includes(id) ? processo[field].filter(item => item !== id) : [...processo[field], id] } as Partial<typeof processo>);
  const addOrgao = async () => { if (!newOrgao.trim()) return; const { error } = await db.from('orgaos').insert({ nome: newOrgao.trim() }); if (error) return toast.error('Não foi possível cadastrar o órgão'); setNewOrgao(''); await refetchOrgaos(); };
  const addProcesso = async () => { if (!newProcesso.trim() || !processo.cliente_id) return; const { error } = await db.from('processos_clientes').insert({ nome: newProcesso.trim(), cliente_id: processo.cliente_id, obra_id: processo.obra_id || null }); if (error) return toast.error('Não foi possível cadastrar o processo'); setNewProcesso(''); await refetchProcessos(); };
  const finish = async () => { if (!processo.cliente_id || !data.responsavel_id) { toast.error('Informe cliente e responsável técnico'); setStep(0); return; } const finalData = { ...data, data_fim: new Date() }; finalizarAtendimento(); await save.mutateAsync(finalData); navigate('/sucesso'); };
  return <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento de Processos">
    <div className="flex gap-2 overflow-x-auto px-4 py-3">{STEPS.map((label, index) => <button key={label} type="button" onClick={() => setStep(index)} className={cn('h-9 shrink-0 rounded-full border px-3 text-xs font-medium', step === index ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground')}>{index + 1}. {label}</button>)}</div>
    <div className="space-y-4 p-4 pb-32">
      {step === 0 && <Card><CardHeader><CardTitle className="text-sm">Identificação</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm font-medium">{data.titulo}</p><div><Label>Cliente</Label><Select value={processo.cliente_id} onValueChange={cliente_id => update({ cliente_id, cliente_nome: clientes.find(item => item.id === cliente_id)?.nome, processo_ids: [], obra_id: undefined, obra_nome: undefined })}><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{clientes.map(item => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div><div><Label>Obra vinculada (opcional)</Label><Select value={processo.obra_id || 'none'} onValueChange={obra_id => { const selected = obras.find((item: any) => item.id === obra_id); update({ obra_id: obra_id === 'none' ? undefined : obra_id, obra_nome: obra_id === 'none' ? undefined : selected?.nome }); }} disabled={!processo.cliente_id}><SelectTrigger><SelectValue placeholder="Sem vínculo com obra" /></SelectTrigger><SelectContent><SelectItem value="none">Sem vínculo com obra</SelectItem>{obras.map((item: any) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div><div><Label>Responsável técnico</Label><Select value={data.responsavel_id} onValueChange={setResponsavelId}><SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger><SelectContent>{responsaveis.map(item => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>}
      {step === 1 && <div className="space-y-4"><Card><CardHeader><CardTitle className="text-sm">Órgãos acompanhados</CardTitle></CardHeader><CardContent className="space-y-3">{orgaos.map((item: any) => <Button key={item.id} type="button" size="sm" variant={selectedOrgaos.has(item.id) ? 'default' : 'outline'} onClick={() => toggle('orgao_ids', item.id)}>{item.nome}</Button>)}<div className="flex gap-2"><Input placeholder="Novo órgão" value={newOrgao} onChange={e => setNewOrgao(e.target.value)} /><Button type="button" size="icon" onClick={addOrgao}><Plus className="h-4 w-4" /></Button></div></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Processos do cliente</CardTitle></CardHeader><CardContent className="space-y-3">{processos.map((item: any) => <Button key={item.id} type="button" size="sm" variant={selectedProcessos.has(item.id) ? 'default' : 'outline'} onClick={() => toggle('processo_ids', item.id)}>{item.nome}</Button>)}<div className="flex gap-2"><Input placeholder="Novo processo" value={newProcesso} onChange={e => setNewProcesso(e.target.value)} disabled={!processo.cliente_id} /><Button type="button" size="icon" onClick={addProcesso} disabled={!processo.cliente_id}><Plus className="h-4 w-4" /></Button></div><Textarea placeholder="Situação atual do acompanhamento" value={processo.situacao} onChange={e => update({ situacao: e.target.value })} /></CardContent></Card></div>}
      {step === 2 && <RegistroVisita />}
      {step === 3 && <Card><CardHeader><CardTitle className="text-sm">Revisão</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Cliente:</strong> {processo.cliente_nome || 'Não informado'}</p><p><strong>Órgãos:</strong> {processo.orgao_ids.length}</p><p><strong>Processos:</strong> {processo.processo_ids.length}</p><p><strong>Demandas:</strong> {data.demandas.filter(item => item.descricao.trim()).length}</p><p><strong>Anotações:</strong> {data.anotacoes_itens.length}</p></CardContent></Card>}
    </div>
    <MobileFooter><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>{step === STEPS.length - 1 ? <Button onClick={finish} disabled={save.isPending}>Finalizar</Button> : <Button onClick={() => setStep(value => Math.min(STEPS.length - 1, value + 1))}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button>}</div></MobileFooter>
  </MobileLayout>;
}
