import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ImagePlus, Landmark, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MobileFooter } from '@/components/mobile';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { RegistroVisita } from '@/components/visita/RegistroVisita';
import { AcompanhamentoStepper } from '@/components/visita/AcompanhamentoStepper';
import { FinalizacaoVisita } from '@/components/visita/FinalizacaoVisita';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { supabase } from '@/integrations/supabase/client';

const STEPS = ['Foto', 'Técnico', 'Identificação', 'Órgãos/processos', 'Registro', 'Final'];
const STATUS_PROCESSO = ['NOTIFICADO', 'AGUARDANDO_ANALISE', 'DEFERIDO', 'INDEFERIDO'];
const RECENT_CLIENTS_KEY = 'processos-clientes-recentes';

export default function AcompanhamentoProcessos() {
  useVisitRoute('/visita/processos');
  const navigate = useNavigate();
  const save = useSaveAtendimento();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const finishingRef = useRef(false);
  const { data, setTitulo, setAcompanhamentoProcessos, addFotoFile, removeFoto, finalizarAtendimento } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const [step, setStep] = useState(0);
  const [newOrgao, setNewOrgao] = useState('');
  const [newProcesso, setNewProcesso] = useState('');
  const [newProcessoCliente, setNewProcessoCliente] = useState('');
  const [newProcessoOrgao, setNewProcessoOrgao] = useState('none');
  const [newProcessoStatus, setNewProcessoStatus] = useState('AGUARDANDO_ANALISE');
  const processo = data.acompanhamento_processos;
  const db = supabase as any;
  const { data: orgaos = [], refetch: refetchOrgaos } = useQuery({ queryKey: ['orgaos-visita'], queryFn: async () => { const { data: result, error } = await db.from('orgaos').select('*').eq('ativo', true).order('nome'); if (error) throw error; return result ?? []; } });
  const { data: processos = [], refetch: refetchProcessos } = useQuery({ queryKey: ['processos-clientes', processo?.cliente_ids], enabled: Boolean(processo?.cliente_ids.length), queryFn: async () => { const { data: result, error } = await db.from('processos_clientes').select('*, orgaos(nome), clientes(nome)').in('cliente_id', processo!.cliente_ids).eq('ativo', true).order('nome'); if (error) throw error; return result ?? []; } });

  useEffect(() => {
    if (!processo || processo.cliente_ids.length) return;
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_CLIENTS_KEY) ?? '[]') as string[];
      const valid = saved.filter((id) => clientes.some((cliente) => cliente.id === id));
      if (valid.length) setAcompanhamentoProcessos((prev) => ({ ...prev, cliente_ids: valid, cliente_id: valid[0], cliente_nome: clientes.find((cliente) => cliente.id === valid[0])?.nome }));
    } catch { /* sem preferências locais */ }
  }, [clientes, processo, setAcompanhamentoProcessos]);

  if (!processo) return null;
  const update = (patch: Partial<typeof processo>) => setAcompanhamentoProcessos((prev) => ({ ...prev, ...patch }));
  const selectedOrgaos = useMemo(() => new Set(processo.orgao_ids), [processo.orgao_ids]);
  const selectedProcessos = useMemo(() => new Set(processo.processo_ids), [processo.processo_ids]);
  const selectedClients = clientes.filter((cliente) => processo.cliente_ids.includes(cliente.id));
  const toggleClient = (id: string) => {
    const next = processo.cliente_ids.includes(id) ? processo.cliente_ids.filter((item) => item !== id) : [...processo.cliente_ids, id];
    const primary = next[0] ?? '';
    update({ cliente_ids: next, cliente_id: primary, cliente_nome: clientes.find((cliente) => cliente.id === primary)?.nome, processo_ids: processo.processo_ids.filter((processId) => processos.some((item: any) => item.id === processId && next.includes(item.cliente_id))) });
    localStorage.setItem(RECENT_CLIENTS_KEY, JSON.stringify(next));
  };
  const toggle = (field: 'orgao_ids' | 'processo_ids', id: string) => update({ [field]: processo[field].includes(id) ? processo[field].filter((item) => item !== id) : [...processo[field], id] } as Partial<typeof processo>);
  const addOrgao = async () => { if (!newOrgao.trim()) return; const { error } = await db.from('orgaos').insert({ nome: newOrgao.trim(), ativo: true }); if (error) return toast.error('Não foi possível cadastrar o órgão'); setNewOrgao(''); await refetchOrgaos(); };
  const addProcesso = async () => {
    if (!newProcesso.trim() || !newProcessoCliente) return;
    const { data: created, error } = await db.from('processos_clientes').insert({ nome: newProcesso.trim(), cliente_id: newProcessoCliente, orgao_id: newProcessoOrgao === 'none' ? null : newProcessoOrgao, situacao_atual: newProcessoStatus, ativo: true }).select().single();
    if (error) return toast.error('Aplique o SQL de Processos no Supabase antes de cadastrar');
    update({ processo_ids: [...processo.processo_ids, created.id] });
    setNewProcesso('');
    await refetchProcessos();
  };
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; try { for (const file of files) await addFotoFile(file, 'final'); } catch { toast.error('Não foi possível salvar a foto'); } };
  const finish = async () => { if (finishingRef.current) return; if (!processo.cliente_ids.length || !data.responsavel_id) { toast.error('Informe ao menos um cliente e o responsável técnico'); setStep(0); return; } finishingRef.current = true; try { const finalData = { ...data, data_fim: data.data_fim ?? new Date(), possui_foto_final: data.fotos.some((foto) => foto.tipo === 'final') }; finalizarAtendimento(); await save.mutateAsync(finalData); navigate('/sucesso'); } finally { finishingRef.current = false; } };

  return <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento de Processos">
    <AcompanhamentoStepper steps={STEPS} currentStep={step + 2} onStepChange={(index) => setStep(index - 2)} />
    <div className="space-y-4 p-4 pb-32">
      {step === 0 && <Card><CardHeader><CardTitle className="text-sm">Identificação</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Título da visita</Label><Input value={data.titulo ?? ''} onChange={(event) => setTitulo(event.target.value)} /></div><div className="space-y-2"><Label>Clientes vinculados</Label><div className="flex flex-wrap gap-2">{clientes.map((cliente) => <Button key={cliente.id} type="button" size="sm" variant={processo.cliente_ids.includes(cliente.id) ? 'default' : 'outline'} onClick={() => toggleClient(cliente.id)}>{cliente.nome}</Button>)}</div><p className="text-xs text-muted-foreground">As últimas escolhas ficam sugeridas neste aparelho para a próxima visita.</p></div></CardContent></Card>}
      {step === 1 && <div className="space-y-4"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Landmark className="h-4 w-4" />Órgãos acompanhados</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2">{orgaos.map((item: any) => <Button key={item.id} type="button" size="sm" variant={selectedOrgaos.has(item.id) ? 'default' : 'outline'} onClick={() => toggle('orgao_ids', item.id)}>{item.nome}</Button>)}</div><div className="flex gap-2"><Input placeholder="Novo órgão" value={newOrgao} onChange={(event) => setNewOrgao(event.target.value)} /><Button type="button" size="icon" onClick={addOrgao}><Plus className="h-4 w-4" /></Button></div></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Cadastrar e selecionar processos</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-4"><Input placeholder="Número ou descrição" value={newProcesso} onChange={(event) => setNewProcesso(event.target.value)} /><Select value={newProcessoCliente} onValueChange={setNewProcessoCliente}><SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger><SelectContent>{selectedClients.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}</SelectContent></Select><Select value={newProcessoOrgao} onValueChange={setNewProcessoOrgao}><SelectTrigger><SelectValue placeholder="Órgão" /></SelectTrigger><SelectContent><SelectItem value="none">Sem órgão</SelectItem>{orgaos.map((orgao: any) => <SelectItem key={orgao.id} value={orgao.id}>{orgao.nome}</SelectItem>)}</SelectContent></Select><Select value={newProcessoStatus} onValueChange={setNewProcessoStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUS_PROCESSO.map((status) => <SelectItem key={status} value={status}>{status.replaceAll('_', ' ')}</SelectItem>)}</SelectContent></Select></div><Button type="button" variant="outline" onClick={addProcesso} disabled={!newProcesso.trim() || !newProcessoCliente}><Plus className="mr-2 h-4 w-4" />Cadastrar processo</Button><div className="space-y-2 border-t pt-3">{processos.map((item: any) => <button key={item.id} type="button" onClick={() => toggle('processo_ids', item.id)} className={`flex w-full items-center justify-between rounded-md border p-3 text-left text-sm ${selectedProcessos.has(item.id) ? 'border-primary bg-primary/5' : ''}`}><span><strong>{item.nome}</strong><span className="ml-2 text-xs text-muted-foreground">{item.clientes?.nome} · {item.orgaos?.nome ?? 'Sem órgão'}</span></span><Badge variant="secondary">{String(item.situacao_atual ?? 'AGUARDANDO_ANALISE').replaceAll('_', ' ')}</Badge></button>)}{processos.length === 0 && <p className="text-sm text-muted-foreground">Selecione clientes para visualizar e cadastrar seus processos.</p>}</div></CardContent></Card></div>}
      {step === 2 && <RegistroVisita />}
      {step === 3 && <Card><CardHeader><CardTitle className="text-sm">Fotos, finalização e revisão</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => cameraInputRef.current?.click()}><Camera className="h-5 w-5" />Tirar foto</Button><Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => galleryInputRef.current?.click()}><ImagePlus className="h-5 w-5" />Galeria</Button></div>{data.fotos.filter((foto) => foto.tipo === 'final').length > 0 && <div className="grid grid-cols-3 gap-2">{data.fotos.filter((foto) => foto.tipo === 'final').map((foto, index) => <div key={foto.fotoId ?? foto.url} className="relative aspect-square overflow-hidden rounded-md"><img src={foto.url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" /><Button type="button" size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7" onClick={() => removeFoto(foto.url)}><Trash2 className="h-3.5 w-3.5" /></Button></div>)}</div>}<div className="rounded-md border p-3 text-sm"><p><strong>Clientes:</strong> {selectedClients.map((cliente) => cliente.nome).join(', ') || 'Não informado'}</p><p><strong>Órgãos:</strong> {processo.orgao_ids.length} · <strong>Processos:</strong> {processo.processo_ids.length}</p></div><FinalizacaoVisita /></CardContent></Card>}
    </div>
    <MobileFooter><div className="grid grid-cols-2 gap-2"><Button variant="outline" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>{step === 3 ? <Button onClick={finish} disabled={save.isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Finalizar</Button> : <Button onClick={() => setStep((value) => Math.min(3, value + 1))}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button>}</div></MobileFooter>
    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" /><input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
  </MobileLayout>;
}
