import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MobileFooter } from '@/components/mobile';
import { StructuredAnswer, type StructuredAnswerLabels } from '@/components/visita/StructuredAnswer';
import { RegistroVisita } from '@/components/visita/RegistroVisita';
import { AcompanhamentoStepper } from '@/components/visita/AcompanhamentoStepper';
import { EncerramentoVisita } from '@/components/visita/EncerramentoVisita';
import { RadarVisita } from '@/components/visita/RadarVisita';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import type { AcompanhamentoAmbientalData, NaoConformidadeObra, PendenciaObra, SimNaoParcialNA } from '@/types/atendimento';

const MODULE_STEPS = ['Identificação', 'Gestão', 'ETE/água', 'Operação', 'Pendências', 'Registro', 'Radar', 'Final'];
const STEPS = ['Foto', 'Técnico', ...MODULE_STEPS];
const FOTO_ITENS = ['Fachada/identificação', 'Área de produção', 'Armazenamento de resíduos', 'Lixeiras/segregação', 'ETE', 'Poço', 'Reservatório', 'Ponto de lançamento', 'Área externa', 'Não conformidade', 'Correção realizada'];
const ANSWER_LABELS = {
  compliance: { SIM: 'Conforme', PARCIALMENTE: 'Parcial', NAO: 'Não conforme', NAO_SE_APLICA: 'N/A' },
  adequacy: { SIM: 'Adequado', PARCIALMENTE: 'Parcial', NAO: 'Inadequado', NAO_SE_APLICA: 'N/A' },
  occurrence: { SIM: 'Não observado', PARCIALMENTE: 'Pontual', NAO: 'Observado', NAO_SE_APLICA: 'N/A' },
  yesNo: { SIM: 'Sim', PARCIALMENTE: 'Parcial', NAO: 'Não', NAO_SE_APLICA: 'N/A' },
  performed: { SIM: 'Realizada', PARCIALMENTE: 'Parcial', NAO: 'Não realizada', NAO_SE_APLICA: 'N/A' },
  needed: { SIM: 'Não necessário', PARCIALMENTE: 'Avaliar', NAO: 'Necessário', NAO_SE_APLICA: 'N/A' },
} satisfies Record<string, StructuredAnswerLabels>;

const gestao: [keyof AcompanhamentoAmbientalData, string, StructuredAnswerLabels][] = [
  ['politica_ambiental', 'Política ambiental respeitada', ANSWER_LABELS.compliance],
  ['coleta_residuos', 'Coleta de resíduos organizada', ANSWER_LABELS.compliance],
  ['gerenciamento_residuos', 'Gerenciamento de resíduos correto', ANSWER_LABELS.compliance],
  ['uso_lixeiras', 'Lixeiras utilizadas adequadamente', ANSWER_LABELS.adequacy],
  ['alteracao_funcionarios', 'Alteração no quadro de funcionários', ANSWER_LABELS.occurrence],
  ['alteracao_producao', 'Alteração na produção', ANSWER_LABELS.occurrence],
];

const ete: [string, string, StructuredAnswerLabels][] = [
  ['possui', 'Empresa possui ETE', ANSWER_LABELS.yesNo],
  ['problema_operacao', 'Problema na operação da ETE', ANSWER_LABELS.occurrence],
  ['novo_operador', 'Necessidade de treinar operador', ANSWER_LABELS.needed],
  ['coleta_efluente', 'Coleta de efluente realizada', ANSWER_LABELS.performed],
  ['odor', 'Odor aparente', ANSWER_LABELS.occurrence],
  ['extravasamento', 'Extravasamento aparente', ANSWER_LABELS.occurrence],
  ['manutencao', 'Manutenção/limpeza registrada', ANSWER_LABELS.yesNo],
];

const agua: [string, string, StructuredAnswerLabels][] = [
  ['leitura_hidrometro', 'Leitura diária do hidrômetro', ANSWER_LABELS.performed],
  ['coleta_poco', 'Coleta de água do poço', ANSWER_LABELS.performed],
  ['lancamento_regular', 'Lançamento regular', ANSWER_LABELS.compliance],
  ['abastecimento_regular', 'Abastecimento regular', ANSWER_LABELS.compliance],
];

const operacao: [string, string, StructuredAnswerLabels][] = [
  ['rotina_adequada', 'Rotina operacional adequada', ANSWER_LABELS.adequacy],
  ['equipe_presente', 'Equipe presente', ANSWER_LABELS.yesNo],
  ['responsavel_presente', 'Responsável presente', ANSWER_LABELS.yesNo],
  ['boas_praticas', 'Boas práticas observadas', ANSWER_LABELS.compliance],
  ['risco_aparente', 'Risco aparente', ANSWER_LABELS.occurrence],
  ['orientacao_repassada', 'Orientação repassada em campo', ANSWER_LABELS.yesNo],
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

function Question({ label, value, onChange, labels }: { label: string; value: SimNaoParcialNA; onChange: (value: SimNaoParcialNA) => void; labels?: StructuredAnswerLabels }) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label className="text-xs">{label}</Label>
      <StructuredAnswer value={value} onChange={onChange} labels={labels} />
    </div>
  );
}

export default function AcompanhamentoAmbiental() {
  useVisitRoute('/visita/ambiental');
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data, setAcompanhamentoAmbiental } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const ambiental = data.acompanhamento_ambiental;

  const [novaNc, setNovaNc] = useState<NaoConformidadeObra>({ id: crypto.randomUUID(), tipo: '', descricao: '', gravidade: 'MEDIA', acao_imediata: false, foto_vinculada: false, responsavel: '', prazo: '', status: 'PENDENTE' });
  const [novaPendencia, setNovaPendencia] = useState<PendenciaObra>({ id: crypto.randomUUID(), descricao: '', responsavel: '', prazo: '', prioridade: 'MEDIA', status: 'PENDENTE' });

  if (!ambiental) return null;

  const update = (patch: Partial<AcompanhamentoAmbientalData>) => setAcompanhamentoAmbiental((prev) => ({ ...prev, ...patch }));
  const updateNested = (section: 'ete' | 'agua' | 'condicoes_operacionais', patch: Record<string, unknown>) =>
    setAcompanhamentoAmbiental((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));

  const selectedClient = clientes.find((cliente) => cliente.id === ambiental.cliente_id);

  const addNc = () => {
    if (!novaNc.descricao.trim()) return;
    update({ nao_conformidades: [...ambiental.nao_conformidades, { ...novaNc, id: crypto.randomUUID() }] });
    setNovaNc({ id: crypto.randomUUID(), tipo: '', descricao: '', gravidade: 'MEDIA', acao_imediata: false, foto_vinculada: false, responsavel: '', prazo: '', status: 'PENDENTE' });
  };

  const addPendencia = () => {
    if (!novaPendencia.descricao.trim()) return;
    update({ pendencias: [...ambiental.pendencias, { ...novaPendencia, id: crypto.randomUUID() }] });
    setNovaPendencia({ id: crypto.randomUUID(), descricao: '', responsavel: '', prazo: '', prioridade: 'MEDIA', status: 'PENDENTE' });
  };

  const validateBeforeSave = () => {
    if (!ambiental.cliente_id) return 'Informe o cliente';
    return null;
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento Ambiental">
      <AcompanhamentoStepper steps={STEPS} currentStep={step + 2} onStepChange={(index) => setStep(index - 2)} />

      <div className="flex-1 overflow-auto p-4 space-y-4 pb-32">
        {step === 0 && (
          <Section title="1. Identificação">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={ambiental.cliente_id} onValueChange={(cliente_id) => update({ cliente_id, cliente_nome: clientes.find((cliente) => cliente.id === cliente_id)?.nome })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>{clientes.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colaborador que acompanhou</Label>
              <Input value={ambiental.colaborador_nome} onChange={(event) => update({ colaborador_nome: event.target.value })} placeholder="Nome do colaborador" />
            </div>
            <div className="space-y-2">
              <Label>Motivo da visita</Label>
              <Select value={ambiental.motivo_visita} onValueChange={(motivo_visita) => update({ motivo_visita: motivo_visita as AcompanhamentoAmbientalData['motivo_visita'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="FISCALIZACAO">Fiscalização</SelectItem><SelectItem value="LEVANTAMENTO_PROJETOS">Levantamento de projetos</SelectItem><SelectItem value="VISITA_TECNICA">Visita técnica</SelectItem><SelectItem value="REUNIAO">Reunião</SelectItem></SelectContent>
              </Select>
            </div>
          </Section>
        )}

        {step === 1 && (
          <Section title="2. Gestão ambiental e resíduos">
            {gestao.map(([key, label, labels]) => <Question key={key} label={label} value={ambiental[key] as SimNaoParcialNA} onChange={(value) => update({ [key]: value } as Partial<AcompanhamentoAmbientalData>)} labels={labels} />)}
          </Section>
        )}

        {step === 2 && (
          <Section title="3. ETE, água e efluentes">
            <p className="text-xs font-medium text-muted-foreground">ETE</p>
            {ete.map(([key, label, labels]) => <Question key={key} label={label} value={ambiental.ete[key as keyof typeof ambiental.ete] as SimNaoParcialNA} onChange={(value) => updateNested('ete', { [key]: value })} labels={labels} />)}
            <div className="space-y-2">
              <Label>Produtos utilizados na ETE</Label>
              <div className="flex flex-wrap gap-2">
                {['Cal', 'Cloro em pó', 'Alcalinizante', 'Coagulante', 'Floculante', 'Reagente biológico'].map((produto) => (
                  <Button key={produto} type="button" size="sm" variant={ambiental.ete.produtos.includes(produto) ? 'default' : 'outline'} onClick={() => update({ ete: { ...ambiental.ete, produtos: ambiental.ete.produtos.includes(produto) ? ambiental.ete.produtos.filter((item) => item !== produto) : [...ambiental.ete.produtos, produto] } })}>{produto}</Button>
                ))}
              </div>
            </div>
            <p className="pt-2 text-xs font-medium text-muted-foreground">Água e efluentes</p>
            {agua.map(([key, label, labels]) => <Question key={key} label={label} value={ambiental.agua[key as keyof typeof ambiental.agua] as SimNaoParcialNA} onChange={(value) => updateNested('agua', { [key]: value })} labels={labels} />)}
          </Section>
        )}

        {step === 3 && (
          <Section title="4. Condições operacionais e equipe">
            {operacao.map(([key, label, labels]) => <Question key={key} label={label} value={ambiental.condicoes_operacionais[key as keyof typeof ambiental.condicoes_operacionais] as SimNaoParcialNA} onChange={(value) => updateNested('condicoes_operacionais', { [key]: value })} labels={labels} />)}
          </Section>
        )}

        {step === 4 && (
          <Section title="5. Orientações, pendências e evidências">
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
              <Button type="button" variant="outline" size="sm" onClick={addNc}><Plus className="mr-2 h-4 w-4" />Adicionar NC</Button>
              {ambiental.nao_conformidades.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{item.tipo || 'Não conformidade'}</p><p className="text-xs text-muted-foreground">{item.descricao}</p></div><Button variant="ghost" size="icon" onClick={() => update({ nao_conformidades: ambiental.nao_conformidades.filter((_, currentIndex) => currentIndex !== index) })}><Trash2 className="h-4 w-4" /></Button></div>)}
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
              <Button type="button" variant="outline" size="sm" onClick={addPendencia}><Plus className="mr-2 h-4 w-4" />Adicionar pendência</Button>
              {ambiental.pendencias.map((item, index) => <div key={item.id} className="flex items-start justify-between gap-3 rounded-md border p-3"><div><p className="text-sm font-medium">{item.descricao}</p><p className="text-xs text-muted-foreground">{item.responsavel || 'Sem responsável'} • {item.prazo || 'Sem prazo'}</p></div><Button variant="ghost" size="icon" onClick={() => update({ pendencias: ambiental.pendencias.filter((_, currentIndex) => currentIndex !== index) })}><Trash2 className="h-4 w-4" /></Button></div>)}
            </div>
          </Section>
        )}

        {step === 5 && <RegistroVisita />}

        {step === 6 && <RadarVisita />}

        {step === 7 && (
          <div className="space-y-4">
            <Section title="Itens da ficha fotografica">
              <div className="flex flex-wrap gap-2">
                {FOTO_ITENS.map((item) => <Badge key={item} variant={ambiental.foto_itens.includes(item) ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => update({ foto_itens: ambiental.foto_itens.includes(item) ? ambiental.foto_itens.filter((fotoItem) => fotoItem !== item) : [...ambiental.foto_itens, item] })}>{item}</Badge>)}
              </div>
            </Section>
            <EncerramentoVisita
              validateBeforeSave={validateBeforeSave}
              summaryItems={[
                { label: 'Cliente principal', value: selectedClient?.nome ?? 'Nao informado' },
                { label: 'Colaborador que acompanhou', value: ambiental.colaborador_nome || 'Nao informado' },
                { label: 'Nao conformidades', value: ambiental.nao_conformidades.length },
                { label: 'Pendencias', value: ambiental.pendencias.length },
              ]}
            />
          </div>
        )}
      </div>

      {step < MODULE_STEPS.length - 1 && <MobileFooter>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          <Button onClick={() => setStep((current) => Math.min(MODULE_STEPS.length - 1, current + 1))}>Continuar<ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </MobileFooter>}
    </MobileLayout>
  );
}
