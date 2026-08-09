import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MobileFooter } from '@/components/mobile';
import { StructuredAnswer } from '@/components/visita/StructuredAnswer';
import { RegistroVisita } from '@/components/visita/RegistroVisita';
import { AcompanhamentoStepper } from '@/components/visita/AcompanhamentoStepper';
import { FinalizacaoVisita } from '@/components/visita/FinalizacaoVisita';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import { supabase } from '@/integrations/supabase/client';
import type { AvancoObraFaixa, NaoConformidadeObra, PendenciaObra, SimNaoParcialNA } from '@/types/atendimento';

const MODULE_STEPS = ['Identificação', 'Situação', 'Ambiente', 'Segurança', 'Resíduos/água', 'Pendências', 'Registro', 'Final'];
const STEPS = ['Foto', 'Técnico', ...MODULE_STEPS];
const STATUS_OBRA = ['Em planejamento', 'Em execução', 'Paralisada', 'Atrasada', 'Concluída'];
const FASES_OBRA = ['Mobilização', 'Terraplenagem', 'Fundação', 'Estrutura', 'Alvenaria', 'Instalações', 'Acabamento', 'Entrega'];
const AVANCOS: AvancoObraFaixa[] = ['0-25%', '26-50%', '51-75%', '76-99%', 'CONCLUIDA'];
const FOTO_ITENS = ['Placa da obra', 'Vista geral da obra', 'Frente de serviço', 'Área construída atual', 'Escavação / terraplenagem', 'Estrutura / concretagem', 'Drenagem', 'Armazenamento de materiais', 'Resíduos da obra', 'Interferência ambiental', 'Vizinhança impactada', 'Acesso de máquinas e caminhões', 'Antes da intervenção', 'Depois da intervenção', 'Não conformidade', 'Correção realizada'];

const controleAmbiental: [string, string][] = [
  ['controle_visivel', 'Controle ambiental visível'],
  ['area_delimitada', 'Área delimitada'],
  ['interferencia_vegetacao', 'Interferência em vegetação'],
  ['supressao_poda', 'Supressão ou poda recente'],
  ['erosao', 'Sinais de erosão'],
  ['carreamento_sedimentos', 'Carreamento de sedimentos'],
  ['material_inadequado', 'Material em local inadequado'],
  ['intervencao_area_sensivel', 'Intervenção em APP / área sensível'],
  ['contaminacao_solo', 'Contaminação do solo'],
  ['poeira', 'Poeira'],
  ['ruido', 'Ruído'],
  ['odor_emissao', 'Odor / emissão'],
];

const organizacaoSeguranca: [string, string][] = [
  ['obra_organizada', 'Obra organizada'],
  ['materiais_armazenados', 'Materiais bem armazenados'],
  ['acessos_livres', 'Acessos livres'],
  ['sinalizacao_basica', 'Sinalização básica'],
  ['area_materiais', 'Área para materiais'],
  ['area_residuos', 'Área para resíduos'],
  ['limpeza_geral', 'Limpeza geral'],
  ['risco_aparente', 'Risco aparente'],
  ['uso_epi', 'Uso de EPI'],
  ['equipe_trabalhando', 'Equipe trabalhando'],
  ['responsavel_presente', 'Responsável presente'],
  ['condicao_insegura', 'Condição insegura'],
  ['orientacao_repassada', 'Orientação repassada'],
];

const residuos: [string, string][] = [
  ['ha_residuos', 'Há resíduos gerados'],
  ['segregados', 'Resíduos segregados'],
  ['acondicionados', 'Acondicionamento adequado'],
  ['ha_cacamba', 'Caçamba ou local definido'],
  ['mistura_residuos', 'Mistura de resíduos'],
  ['residuos_espalhados', 'Resíduos espalhados'],
  ['residuos_perigosos', 'Resíduos perigosos/contaminados'],
  ['houve_coleta', 'Coleta desde a última visita'],
  ['comprovante_destinacao', 'Comprovante de destinação'],
];

const efluentes: [string, string][] = [
  ['acumulo_agua', 'Acúmulo de água'],
  ['drenagem_provisoria', 'Drenagem provisória'],
  ['erosao_escoamento', 'Erosão por escoamento'],
  ['lancamento_irregular', 'Lançamento irregular'],
  ['lama_via_publica', 'Lama na via pública'],
  ['protecao_bocas_lobo', 'Proteção de drenagem'],
  ['banheiro_quimico', 'Estrutura sanitária'],
  ['vazamento', 'Vazamento'],
  ['odor_extravasamento', 'Odor/extravasamento'],
  ['registro_coleta_manutencao', 'Registro de manutenção'],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Question({ label, value, onChange }: { label: string; value: SimNaoParcialNA; onChange: (value: SimNaoParcialNA) => void }) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label className="text-xs">{label}</Label>
      <StructuredAnswer value={value} onChange={onChange} />
    </div>
  );
}

export default function AcompanhamentoObras() {
  useVisitRoute('/visita/obras');
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const { data, setTitulo, setAcompanhamentoObra, addNaoConformidade, removeNaoConformidade, addPendenciaObra, removePendenciaObra, addFotoFile, removeFoto, finalizarAtendimento } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const { data: responsaveis = [] } = useResponsaveis();
  const saveAtendimento = useSaveAtendimento();
  const obra = data.acompanhamento_obra;

  const { data: obras = [] } = useQuery({
    queryKey: ['obras', obra?.cliente_id],
    enabled: Boolean(obra?.cliente_id),
    queryFn: async () => {
      const { data: items, error } = await supabase.from('obras').select('*').eq('cliente_id', obra!.cliente_id).eq('ativo', true).order('nome');
      if (error) throw error;
      return items;
    },
  });

  const [novaNc, setNovaNc] = useState<NaoConformidadeObra>({
    id: crypto.randomUUID(),
    tipo: '',
    descricao: '',
    gravidade: 'MEDIA',
    acao_imediata: false,
    foto_vinculada: false,
    responsavel: '',
    prazo: '',
    status: 'PENDENTE',
  });
  const [novaPendencia, setNovaPendencia] = useState<PendenciaObra>({
    id: crypto.randomUUID(),
    descricao: '',
    responsavel: '',
    prazo: '',
    prioridade: 'MEDIA',
    status: 'PENDENTE',
  });

  const selectedClient = useMemo(() => clientes.find((cliente) => cliente.id === obra?.cliente_id), [clientes, obra?.cliente_id]);
  const selectedResponsavel = responsaveis.find((responsavel) => responsavel.id === data.responsavel_id);
  const finalFotos = data.fotos.filter((foto) => foto.tipo === 'final');

  if (!obra) return null;

  const updateObra = (patch: Partial<typeof obra>) => setAcompanhamentoObra((prev) => ({ ...prev, ...patch }));
  const updateNested = (section: keyof typeof obra, patch: Record<string, unknown>) =>
    setAcompanhamentoObra((prev) => ({ ...prev, [section]: { ...(prev[section] as Record<string, unknown>), ...patch } }));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    try {
      for (const file of files) await addFotoFile(file, 'final');
      toast.success(files.length === 1 ? 'Foto adicionada' : `${files.length} fotos adicionadas`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar foto');
    }
  };

  const handleAddNc = () => {
    if (!novaNc.descricao.trim()) return;
    addNaoConformidade({ ...novaNc, id: crypto.randomUUID() });
    setNovaNc({ id: crypto.randomUUID(), tipo: '', descricao: '', gravidade: 'MEDIA', acao_imediata: false, foto_vinculada: false, responsavel: '', prazo: '', status: 'PENDENTE' });
  };

  const handleAddPendencia = () => {
    if (!novaPendencia.descricao.trim()) return;
    addPendenciaObra({ ...novaPendencia, id: crypto.randomUUID() });
    setNovaPendencia({ id: crypto.randomUUID(), descricao: '', responsavel: '', prazo: '', prioridade: 'MEDIA', status: 'PENDENTE' });
  };

  const canFinish = Boolean(obra.cliente_id && data.responsavel_id && obra.obra_nome.trim());
  const handleFinalizar = async () => {
    if (!canFinish) {
      toast.error('Informe cliente, responsável técnico e obra');
      setStep(0);
      return;
    }
    const finalData = { ...data, data_fim: new Date(), possui_foto_final: data.fotos.length > 0 };
    finalizarAtendimento();
    await saveAtendimento.mutateAsync(finalData);
    navigate('/sucesso');
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento de Obras">
      <AcompanhamentoStepper steps={STEPS} currentStep={step + 2} onStepChange={(index) => setStep(index - 2)} />

      <div className="flex-1 overflow-auto p-4 space-y-4 pb-32">
        {step === 0 && (
          <Section title="1. Identificação">
            <div className="space-y-2 rounded-md bg-primary/5 p-3 text-sm"><Label htmlFor="titulo-obra">Título da visita</Label><Input id="titulo-obra" value={data.titulo ?? ''} onChange={(event) => setTitulo(event.target.value)} /><p className="text-xs text-muted-foreground">Título sugerido automaticamente; pode ser ajustado quando necessário.</p></div>

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={obra.cliente_id} onValueChange={(cliente_id) => updateObra({ cliente_id, cliente_nome: clientes.find((cliente) => cliente.id === cliente_id)?.nome, obra_id: undefined, obra_nome: '' })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clientes.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>


            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={obra.obra_existente ? 'default' : 'outline'} onClick={() => updateObra({ obra_existente: true, obra_id: undefined, obra_nome: '' })}>Selecionar obra</Button>
              <Button type="button" variant={!obra.obra_existente ? 'default' : 'outline'} onClick={() => updateObra({ obra_existente: false, obra_id: undefined, obra_nome: '' })}>Cadastrar nova</Button>
            </div>

            {obra.obra_existente ? (
              <div className="space-y-2">
                <Label>Obra existente</Label>
                <Select value={obra.obra_id} onValueChange={(obra_id) => { const selected = obras.find((item) => item.id === obra_id); updateObra({ obra_id, obra_nome: selected?.nome ?? '' }); }} disabled={!obra.cliente_id}>
                  <SelectTrigger><SelectValue placeholder={obra.cliente_id ? 'Selecione a obra' : 'Selecione o cliente primeiro'} /></SelectTrigger>
                  <SelectContent>{obras.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Nova obra</Label>
                <Input value={obra.obra_nome} onChange={(event) => updateObra({ obra_nome: event.target.value, obra_id: undefined })} placeholder="Nome da obra" />
              </div>
            )}
          </Section>
        )}

        {step === 1 && (
          <Section title="2. Situação da obra">
            <div className="space-y-2">
              <Label>Status geral</Label>
              <Select value={obra.status_geral} onValueChange={(status_geral) => updateObra({ status_geral })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{STATUS_OBRA.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fase atual</Label>
              <Select value={obra.fase_atual} onValueChange={(fase_atual) => updateObra({ fase_atual })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{FASES_OBRA.map((fase) => <SelectItem key={fase} value={fase}>{fase}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Avanço aproximado</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {AVANCOS.map((avanco) => <Button key={avanco} type="button" variant={obra.percentual_avanco_faixa === avanco ? 'default' : 'outline'} className="h-10 px-1 text-[11px]" onClick={() => updateObra({ percentual_avanco_faixa: avanco, percentual_avanco: avanco === 'CONCLUIDA' ? 100 : Number(avanco.split('-')[0]) })}>{avanco === 'CONCLUIDA' ? 'Concl.' : avanco}</Button>)}
              </div>
            </div>
            <Question label="Houve avanço desde a última visita?" value={obra.houve_avanco ? 'SIM' : 'NAO'} onChange={(value) => updateObra({ houve_avanco: value === 'SIM' })} />
            <Question label="Está dentro do previsto?" value={obra.dentro_do_previsto ? 'SIM' : 'NAO'} onChange={(value) => updateObra({ dentro_do_previsto: value === 'SIM' })} />
            <Question label="Pendências anteriores resolvidas?" value={obra.pendencias_resolvidas ? 'SIM' : 'NAO'} onChange={(value) => updateObra({ pendencias_resolvidas: value === 'SIM' })} />
          </Section>
        )}

        {step === 2 && (
          <Section title="3. Controle ambiental">
            {controleAmbiental.map(([key, label]) => (
              <Question key={key} label={label} value={obra.controle_ambiental[key as keyof typeof obra.controle_ambiental] as SimNaoParcialNA} onChange={(value) => updateNested('controle_ambiental', { [key]: value })} />
            ))}
          </Section>
        )}

        {step === 3 && (
          <Section title="4. Organização, segurança e boas práticas">
            {organizacaoSeguranca.map(([key, label]) => (
              <Question key={key} label={label} value={obra.organizacao_seguranca[key as keyof typeof obra.organizacao_seguranca] as SimNaoParcialNA} onChange={(value) => updateNested('organizacao_seguranca', { [key]: value })} />
            ))}
          </Section>
        )}

        {step === 4 && (
          <Section title="5. Resíduos, água e drenagem">
            <p className="text-xs font-medium text-muted-foreground">Resíduos</p>
            {residuos.map(([key, label]) => (
              <Question key={key} label={label} value={obra.residuos[key as keyof typeof obra.residuos] as SimNaoParcialNA} onChange={(value) => updateNested('residuos', { [key]: value })} />
            ))}
            <p className="pt-2 text-xs font-medium text-muted-foreground">Água, efluentes e drenagem</p>
            {efluentes.map(([key, label]) => (
              <Question key={key} label={label} value={obra.efluentes[key as keyof typeof obra.efluentes] as SimNaoParcialNA} onChange={(value) => updateNested('efluentes', { [key]: value })} />
            ))}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2"><Label>Uso de água</Label><Select value={obra.efluentes.uso_agua} onValueChange={(uso_agua) => updateNested('efluentes', { uso_agua })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Sem uso observado">Sem uso observado</SelectItem><SelectItem value="Uso pontual">Uso pontual</SelectItem><SelectItem value="Uso contínuo">Uso contínuo</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Origem da água</Label><Select value={obra.efluentes.origem_agua} onValueChange={(origem_agua) => updateNested('efluentes', { origem_agua })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Rede pública">Rede pública</SelectItem><SelectItem value="Poço">Poço</SelectItem><SelectItem value="Caminhão-pipa">Caminhão-pipa</SelectItem><SelectItem value="Não identificado">Não identificado</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Destinação sanitária</Label><Select value={obra.efluentes.destinacao_efluentes} onValueChange={(destinacao_efluentes) => updateNested('efluentes', { destinacao_efluentes })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="Banheiro químico">Banheiro químico</SelectItem><SelectItem value="Rede pública">Rede pública</SelectItem><SelectItem value="Fossa/sumidouro">Fossa/sumidouro</SelectItem><SelectItem value="Não identificado">Não identificado</SelectItem></SelectContent></Select></div>
            </div>
          </Section>
        )}

        {step === 5 && (
          <Section title="6. Não conformidades e pendências">
            <div className="space-y-3">
              <p className="text-sm font-medium">Não conformidade</p>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Tipo" value={novaNc.tipo} onChange={(event) => setNovaNc((prev) => ({ ...prev, tipo: event.target.value }))} />
                <Input placeholder="Descrição" value={novaNc.descricao} onChange={(event) => setNovaNc((prev) => ({ ...prev, descricao: event.target.value }))} />
                <Input placeholder="Responsável" value={novaNc.responsavel} onChange={(event) => setNovaNc((prev) => ({ ...prev, responsavel: event.target.value }))} />
                <Input placeholder="Prazo" value={novaNc.prazo} onChange={(event) => setNovaNc((prev) => ({ ...prev, prazo: event.target.value }))} />
                <Select value={novaNc.gravidade} onValueChange={(gravidade) => setNovaNc((prev) => ({ ...prev, gravidade: gravidade as NaoConformidadeObra['gravidade'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BAIXA">Baixa</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="ALTA">Alta</SelectItem></SelectContent></Select>
                <Select value={novaNc.status} onValueChange={(status) => setNovaNc((prev) => ({ ...prev, status: status as NaoConformidadeObra['status'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem><SelectItem value="CONCLUIDO">Concluído</SelectItem></SelectContent></Select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={novaNc.acao_imediata} onCheckedChange={(checked) => setNovaNc((prev) => ({ ...prev, acao_imediata: Boolean(checked) }))} />Ação imediata</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={novaNc.foto_vinculada} onCheckedChange={(checked) => setNovaNc((prev) => ({ ...prev, foto_vinculada: Boolean(checked), foto_id: checked ? prev.foto_id : undefined }))} />Vincular foto</label>
                {novaNc.foto_vinculada && <Select value={novaNc.foto_id} onValueChange={(foto_id) => setNovaNc((prev) => ({ ...prev, foto_id }))}><SelectTrigger className="w-44"><SelectValue placeholder="Foto" /></SelectTrigger><SelectContent>{data.fotos.map((foto, index) => <SelectItem key={foto.fotoId ?? foto.url} value={foto.fotoId ?? foto.url}>Foto {index + 1}</SelectItem>)}</SelectContent></Select>}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddNc}><Plus className="mr-2 h-4 w-4" />Adicionar NC</Button>
              {obra.nao_conformidades.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{item.tipo || 'Não conformidade'}</p><p className="text-xs text-muted-foreground">{item.descricao}</p></div><Button variant="ghost" size="icon" onClick={() => removeNaoConformidade(index)}><Trash2 className="h-4 w-4" /></Button></div>)}
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Pendência</p>
              <div className="grid gap-2 md:grid-cols-2">
                <Input placeholder="Descrição" value={novaPendencia.descricao} onChange={(event) => setNovaPendencia((prev) => ({ ...prev, descricao: event.target.value }))} />
                <Input placeholder="Responsável" value={novaPendencia.responsavel} onChange={(event) => setNovaPendencia((prev) => ({ ...prev, responsavel: event.target.value }))} />
                <Input placeholder="Prazo" value={novaPendencia.prazo} onChange={(event) => setNovaPendencia((prev) => ({ ...prev, prazo: event.target.value }))} />
                <Select value={novaPendencia.prioridade} onValueChange={(prioridade) => setNovaPendencia((prev) => ({ ...prev, prioridade: prioridade as PendenciaObra['prioridade'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="BAIXA">Baixa</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="ALTA">Alta</SelectItem></SelectContent></Select>
                <Select value={novaPendencia.status} onValueChange={(status) => setNovaPendencia((prev) => ({ ...prev, status: status as PendenciaObra['status'] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem><SelectItem value="CONCLUIDO">Concluído</SelectItem></SelectContent></Select>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPendencia}><Plus className="mr-2 h-4 w-4" />Adicionar pendência</Button>
              {obra.pendencias.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{item.descricao}</p><p className="text-xs text-muted-foreground">{item.responsavel || 'Sem responsável'} • {item.prazo || 'Sem prazo'}</p></div><Button variant="ghost" size="icon" onClick={() => removePendenciaObra(index)}><Trash2 className="h-4 w-4" /></Button></div>)}
            </div>
          </Section>
        )}

        {step === 6 && <RegistroVisita />}

        {step === 7 && (
          <Section title="7. Fotos e revisão">
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => cameraInputRef.current?.click()}><Camera className="h-5 w-5" />Tirar foto</Button>
              <Button type="button" variant="outline" className="h-16 flex-col gap-1" onClick={() => galleryInputRef.current?.click()}><ImagePlus className="h-5 w-5" />Galeria</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {FOTO_ITENS.map((item) => (
                <Badge key={item} variant={obra.foto_itens.includes(item) ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => updateObra({ foto_itens: obra.foto_itens.includes(item) ? obra.foto_itens.filter((fotoItem) => fotoItem !== item) : [...obra.foto_itens, item] })}>{item}</Badge>
              ))}
            </div>
            {finalFotos.length > 0 && <div className="grid grid-cols-3 gap-2">{finalFotos.map((foto, index) => <div key={foto.fotoId ?? foto.url} className="group relative aspect-square overflow-hidden rounded-md bg-muted"><img src={foto.url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeFoto(foto.url)} className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground"><Trash2 className="h-3 w-3" /></button></div>)}</div>}
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">{data.titulo}</p>
              <p className="text-muted-foreground">{selectedClient?.nome || 'Cliente não selecionado'} • {obra.obra_nome || 'Obra não informada'}</p>
              <p className="text-muted-foreground">{selectedResponsavel?.nome || 'Responsável não selecionado'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary">{obra.nao_conformidades.length} NC</Badge>
                <Badge variant="secondary">{obra.pendencias.length} pendências</Badge>
                <Badge variant="secondary">{data.fotos.length} fotos</Badge>
              </div>
            </div>
            <FinalizacaoVisita />
          </Section>
        )}
      </div>

      <MobileFooter>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          {step < MODULE_STEPS.length - 1 ? (
            <Button onClick={() => setStep((current) => Math.min(MODULE_STEPS.length - 1, current + 1))}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button>
          ) : (
            <Button onClick={handleFinalizar} disabled={saveAtendimento.isPending || !canFinish}><CheckCircle2 className="mr-2 h-4 w-4" />Finalizar</Button>
          )}
        </div>
      </MobileFooter>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
    </MobileLayout>
  );
}
