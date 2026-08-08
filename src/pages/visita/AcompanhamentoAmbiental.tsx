import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import type { AcompanhamentoAmbientalData, SimNaoParcialNA } from '@/types/atendimento';

const ANSWERS: SimNaoParcialNA[] = ['SIM', 'NAO', 'PARCIALMENTE', 'NAO_SE_APLICA'];
const DOCUMENTS = ['OUTORGA', 'PEA', 'CAR', 'PCA', 'RCA', 'PGRS', 'RIAA'];
const ETE_PRODUCTS = ['Cal', 'Cloro em pó', 'Alcalinizante', 'Coagulante', 'Floculante', 'Reagente biológico'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="border-border/70"><CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent className="space-y-4">{children}</CardContent></Card>;
}

function Answer({ value, onChange }: { value: SimNaoParcialNA; onChange: (value: SimNaoParcialNA) => void }) {
  return <ToggleGroup type="single" value={value} onValueChange={(next) => next && onChange(next as SimNaoParcialNA)} className="flex flex-wrap justify-start gap-2">
    {ANSWERS.map(answer => <ToggleGroupItem key={answer} value={answer} className="h-auto px-3 py-2 text-xs">{answer.replaceAll('_', ' ')}</ToggleGroupItem>)}
  </ToggleGroup>;
}

function Question({ label, value, onChange }: { label: string; value: SimNaoParcialNA; onChange: (value: SimNaoParcialNA) => void }) {
  return <div className="space-y-2"><Label>{label}</Label><Answer value={value} onChange={onChange} /></div>;
}

export default function AcompanhamentoAmbiental() {
  useVisitRoute('/visita/ambiental');
  const navigate = useNavigate();
  const { data, setAcompanhamentoAmbiental, finalizarAtendimento } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const ambiental = data.acompanhamento_ambiental;
  const saveAtendimento = useSaveAtendimento();
  if (!ambiental) return null;

  const update = (patch: Partial<AcompanhamentoAmbientalData>) => setAcompanhamentoAmbiental(prev => ({ ...prev, ...patch }));
  const setDocument = (name: string) => update({ documentos_ambientais: ambiental.documentos_ambientais.includes(name) ? ambiental.documentos_ambientais.filter(item => item !== name) : [...ambiental.documentos_ambientais, name] });
  const setProduct = (name: string) => update({ ete: { ...ambiental.ete, produtos: ambiental.ete.produtos.includes(name) ? ambiental.ete.produtos.filter(item => item !== name) : [...ambiental.ete.produtos, name] } });
  const handleFinalizar = async () => { const finalData = { ...data, data_fim: new Date() }; finalizarAtendimento(); await saveAtendimento.mutateAsync(finalData); navigate('/sucesso'); };

  return <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento Ambiental">
    <div className="flex-1 overflow-auto p-4 space-y-4 pb-32">
      <Card className="border-lime-600/25 bg-lime-500/5"><CardContent className="p-4 space-y-3">
        <div className="flex gap-3"><Leaf className="mt-0.5 h-5 w-5 text-lime-700" /><div><p className="text-sm font-semibold">Visita ambiental</p><p className="text-xs text-muted-foreground">Gestão ambiental, ETE, água, documentos e evidências do estabelecimento.</p></div></div>
        <div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Cliente</Label><Select value={ambiental.cliente_id} onValueChange={cliente_id => update({ cliente_id, cliente_nome: clientes.find(cliente => cliente.id === cliente_id)?.nome })}><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{clientes.map(cliente => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Atividade / setor acompanhado</Label><Input value={ambiental.atividade} onChange={event => update({ atividade: event.target.value })} /></div></div>
        <div className="space-y-2"><Label>Motivo da visita</Label><Select value={ambiental.motivo_visita} onValueChange={motivo_visita => update({ motivo_visita: motivo_visita as AcompanhamentoAmbientalData['motivo_visita'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FISCALIZACAO">Fiscalização</SelectItem><SelectItem value="LEVANTAMENTO_PROJETOS">Levantamento de projetos</SelectItem><SelectItem value="VISITA_TECNICA">Visita técnica</SelectItem><SelectItem value="REUNIAO">Reunião</SelectItem></SelectContent></Select></div>
      </CardContent></Card>

      <Section title="Gestão ambiental e resíduos"><Question label="A política ambiental é respeitada pelos colaboradores?" value={ambiental.politica_ambiental} onChange={politica_ambiental => update({ politica_ambiental })} /><Question label="Há coleta de resíduos recicláveis e não recicláveis?" value={ambiental.coleta_residuos} onChange={coleta_residuos => update({ coleta_residuos })} /><Question label="O gerenciamento de resíduos sólidos está correto?" value={ambiental.gerenciamento_residuos} onChange={gerenciamento_residuos => update({ gerenciamento_residuos })} /><Question label="As lixeiras são utilizadas adequadamente?" value={ambiental.uso_lixeiras} onChange={uso_lixeiras => update({ uso_lixeiras })} /><div className="space-y-2"><Label>Dificuldades na coleta ou destinação</Label><Textarea value={ambiental.dificuldade_coleta} onChange={event => update({ dificuldade_coleta: event.target.value })} /></div><div className="space-y-2"><Label>Necessidade de palestra ou educação ambiental</Label><Textarea value={ambiental.necessidade_palestra} onChange={event => update({ necessidade_palestra: event.target.value })} /></div></Section>

      <Section title="ETE, água e operação"><Question label="A empresa possui ETE?" value={ambiental.ete.possui} onChange={possui => update({ ete: { ...ambiental.ete, possui } })} /><div className="space-y-2"><Label>Produtos utilizados na ETE</Label><div className="flex flex-wrap gap-2">{ETE_PRODUCTS.map(product => <Button key={product} type="button" variant={ambiental.ete.produtos.includes(product) ? 'default' : 'outline'} size="sm" onClick={() => setProduct(product)}>{product}</Button>)}</div></div><Question label="Há problema na operação da ETE?" value={ambiental.ete.problema_operacao} onChange={problema_operacao => update({ ete: { ...ambiental.ete, problema_operacao } })} /><Question label="É necessário treinar novo operador da ETE?" value={ambiental.ete.novo_operador} onChange={novo_operador => update({ ete: { ...ambiental.ete, novo_operador } })} /><Question label="Houve coleta de efluente na ETE nesta visita?" value={ambiental.ete.coleta_efluente} onChange={coleta_efluente => update({ ete: { ...ambiental.ete, coleta_efluente } })} /><Question label="Há leitura diária do hidrômetro?" value={ambiental.agua.leitura_hidrometro} onChange={leitura_hidrometro => update({ agua: { ...ambiental.agua, leitura_hidrometro } })} /><Question label="Houve coleta de água do poço nesta visita?" value={ambiental.agua.coleta_poco} onChange={coleta_poco => update({ agua: { ...ambiental.agua, coleta_poco } })} /></Section>

      <Section title="Documentos, equipe e orientações"><div className="space-y-2"><Label>Documentos ambientais contemplados</Label><div className="flex flex-wrap gap-2">{DOCUMENTS.map(document => <Button key={document} type="button" variant={ambiental.documentos_ambientais.includes(document) ? 'default' : 'outline'} size="sm" onClick={() => setDocument(document)}>{document}</Button>)}</div></div><Question label="Houve alteração no quadro de funcionários?" value={ambiental.alteracao_funcionarios} onChange={alteracao_funcionarios => update({ alteracao_funcionarios })} /><Question label="Houve alteração na produção?" value={ambiental.alteracao_producao} onChange={alteracao_producao => update({ alteracao_producao })} /><div className="space-y-2"><Label>Documento entregue nesta visita</Label><Input value={ambiental.documento_entregue} onChange={event => update({ documento_entregue: event.target.value })} /></div><div className="space-y-2"><Label>Orientações e pendências repassadas</Label><Textarea value={ambiental.orientacao_pendencias} onChange={event => update({ orientacao_pendencias: event.target.value })} /></div></Section>

      <Section title="Levantamentos e evidências"><div className="space-y-3">{ambiental.levantamentos.map((item, index) => <div key={item.nome} className="space-y-2 rounded-md border p-3"><Label>{item.nome}</Label><Answer value={item.status} onChange={status => update({ levantamentos: ambiental.levantamentos.map((current, currentIndex) => currentIndex === index ? { ...current, status } : current) })} /></div>)}</div></Section>

      <Section title="Acompanhamento e observações"><div className="grid gap-3 md:grid-cols-2"><div className="space-y-2"><Label>Nome do colaborador que acompanhou</Label><Input value={ambiental.colaborador_nome} onChange={event => update({ colaborador_nome: event.target.value })} /></div><div className="space-y-2"><Label>Cargo</Label><Input value={ambiental.colaborador_cargo} onChange={event => update({ colaborador_cargo: event.target.value })} /></div></div><div className="space-y-2"><Label>Observações importantes</Label><Textarea value={ambiental.observacoes} onChange={event => update({ observacoes: event.target.value })} /></div></Section>
    </div>
    <div className="sticky bottom-0 border-t bg-background/95 px-4 py-3"><Button className="h-14 w-full text-base" onClick={handleFinalizar} disabled={saveAtendimento.isPending}>Finalizar acompanhamento<ArrowRight className="ml-2 h-5 w-5" /></Button></div>
  </MobileLayout>;
}
