import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import type { NaoConformidadeObra, PendenciaObra, SimNaoParcialNA } from '@/types/atendimento';

const OPTIONS: SimNaoParcialNA[] = ['SIM', 'NAO', 'PARCIALMENTE', 'NAO_SE_APLICA'];

function ToggleResposta({
  value,
  onChange,
}: {
  value: SimNaoParcialNA;
  onChange: (value: SimNaoParcialNA) => void;
}) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(v) => v && onChange(v as SimNaoParcialNA)} className="flex flex-wrap justify-start gap-2">
      {OPTIONS.map((option) => (
        <ToggleGroupItem key={option} value={option} aria-label={option} className="px-3 py-2 h-auto text-xs">
          {option.replaceAll('_', ' ')}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function FieldBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function AcompanhamentoObras() {
  useVisitRoute('/visita/obras');
  const navigate = useNavigate();
  const { data, setAcompanhamentoObra, addNaoConformidade, removeNaoConformidade, addPendenciaObra, removePendenciaObra, finalizarAtendimento } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const obra = data.acompanhamento_obra;
  const saveAtendimento = useSaveAtendimento();
  const { data: obras = [] } = useQuery({
    queryKey: ['obras', obra?.cliente_id], enabled: Boolean(obra?.cliente_id && obra?.obra_existente),
    queryFn: async () => { const { data: items, error } = await supabase.from('obras').select('*').eq('cliente_id', obra!.cliente_id).eq('ativo', true).order('nome'); if (error) throw error; return items; },
  });

  const [novaNc, setNovaNc] = useState<NaoConformidadeObra>({
    id: crypto.randomUUID(),
    tipo: '',
    descricao: '',
    gravidade: 'MEDIA',
    acao_imediata: false,
    foto_vinculada: false,
    foto_id: undefined,
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

  const selectedClient = useMemo(
    () => clientes.find(c => c.id === obra?.cliente_id),
    [clientes, obra?.cliente_id],
  );

  if (!obra) return null;

  const updateObra = (patch: Partial<typeof obra>) => setAcompanhamentoObra(prev => ({ ...prev, ...patch }));
  const updateNested = (section: keyof typeof obra, patch: Record<string, any>) =>
    setAcompanhamentoObra(prev => ({ ...prev, [section]: { ...(prev[section] as Record<string, any>), ...patch } }));

  const handleAddNc = () => {
    if (!novaNc.tipo.trim() && !novaNc.descricao.trim()) return;
    addNaoConformidade({ ...novaNc, id: crypto.randomUUID() });
    setNovaNc({
      id: crypto.randomUUID(),
      tipo: '',
      descricao: '',
      gravidade: 'MEDIA',
      acao_imediata: false,
      foto_vinculada: false,
      foto_id: undefined,
      responsavel: '',
      prazo: '',
      status: 'PENDENTE',
    });
  };

  const handleAddPendencia = () => {
    if (!novaPendencia.descricao.trim()) return;
    addPendenciaObra({ ...novaPendencia, id: crypto.randomUUID() });
    setNovaPendencia({
      id: crypto.randomUUID(),
      descricao: '',
      responsavel: '',
      prazo: '',
      prioridade: 'MEDIA',
      status: 'PENDENTE',
    });
  };

  const handleFinalizar = async () => {
    const finalData = { ...data, data_fim: new Date() };
    finalizarAtendimento();
    await saveAtendimento.mutateAsync(finalData);
    navigate('/sucesso');
  };

  const finalizados = obra.nao_conformidades.length + obra.pendencias.length;

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Acompanhamento de Obras">
      <div className="flex-1 overflow-auto p-4 space-y-4 pb-32">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Novo acompanhamento</p>
                <p className="text-xs text-muted-foreground">Registre a leitura da obra, do ambiente e das pendências.</p>
              </div>
              <Badge variant="secondary">{finalizados} registros</Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={obra.cliente_id} onValueChange={(v) => updateObra({ cliente_id: v, cliente_nome: clientes.find(c => c.id === v)?.nome })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Obra</Label>
                {obra.obra_existente ? (
                  <Select value={obra.obra_id} onValueChange={obra_id => { const selected = obras.find(item => item.id === obra_id); updateObra({ obra_id, obra_nome: selected?.nome ?? '' }); }}>
                    <SelectTrigger><SelectValue placeholder={obra.cliente_id ? 'Selecione a obra' : 'Selecione o cliente primeiro'} /></SelectTrigger>
                    <SelectContent>{obras.map(item => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}</SelectContent>
                  </Select>
                ) : <Input value={obra.obra_nome} onChange={(e) => updateObra({ obra_nome: e.target.value, obra_id: undefined })} placeholder="Nome da nova obra" />}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Obra existente</p>
                <p className="text-xs text-muted-foreground">{obra.obra_existente ? selectedClient ? `Vinculada a ${selectedClient.nome}` : 'Vinculada a obra já cadastrada' : 'Criando novo acompanhamento'}</p>
              </div>
              <Checkbox checked={obra.obra_existente} onCheckedChange={(v) => updateObra({ obra_existente: Boolean(v), obra_id: Boolean(v) ? obra.obra_id : undefined })} />
            </div>
          </CardContent>
        </Card>

        <FieldBlock title="2. Situação Geral da Obra">
          <div className="space-y-2">
            <Label>Status geral</Label>
            <Input value={obra.status_geral} onChange={(e) => updateObra({ status_geral: e.target.value })} placeholder="Ex.: Em execução, em fase de acabamento..." />
          </div>
          <div className="space-y-2">
            <Label>Fase atual</Label>
            <Input value={obra.fase_atual} onChange={(e) => updateObra({ fase_atual: e.target.value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2"><Label>Houve avanço?</Label><ToggleResposta value={obra.houve_avanco ? 'SIM' : 'NAO'} onChange={(v) => updateObra({ houve_avanco: v === 'SIM' })} /></div>
            <div className="space-y-2"><Label>Dentro do previsto?</Label><ToggleResposta value={obra.dentro_do_previsto ? 'SIM' : 'NAO'} onChange={(v) => updateObra({ dentro_do_previsto: v === 'SIM' })} /></div>
            <div className="space-y-2"><Label>% de avanço</Label><Input type="number" min={0} max={100} value={obra.percentual_avanco} onChange={(e) => updateObra({ percentual_avanco: Number(e.target.value) })} /></div>
          </div>
          <div className="space-y-2"><Label>Resumo rápido da semana</Label><Textarea value={obra.resumo_semana} onChange={(e) => updateObra({ resumo_semana: e.target.value })} /></div>
          <div className="space-y-2"><Label>O que mudou desde a visita anterior</Label><Textarea value={obra.mudou_desde_visita_anterior} onChange={(e) => updateObra({ mudou_desde_visita_anterior: e.target.value })} /></div>
          <div className="space-y-2"><Label>Pendências anteriores resolvidas?</Label><ToggleResposta value={obra.pendencias_resolvidas ? 'SIM' : 'NAO'} onChange={(v) => updateObra({ pendencias_resolvidas: v === 'SIM' })} /></div>
        </FieldBlock>

        <FieldBlock title="3. Controle Ambiental da Obra">
          <div className="grid gap-4 md:grid-cols-2">
            {[
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
            ].map(([key, label]) => (
              <div key={key as string} className="space-y-2">
                <Label>{label}</Label>
                <ToggleResposta value={obra.controle_ambiental[key as keyof typeof obra.controle_ambiental] as SimNaoParcialNA} onChange={(v) => updateNested('controle_ambiental', { [key]: v })} />
              </div>
            ))}
          </div>
          <div className="space-y-2"><Label>Observações ambientais</Label><Textarea value={obra.controle_ambiental.observacoes} onChange={(e) => updateNested('controle_ambiental', { observacoes: e.target.value })} /></div>
        </FieldBlock>

        <FieldBlock title="4. Organização, Segurança e Boas Práticas">
          <div className="grid gap-4 md:grid-cols-2">
            {[
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
            ].map(([key, label]) => (
              <div key={key as string} className="space-y-2">
                <Label>{label}</Label>
                <ToggleResposta value={obra.organizacao_seguranca[key as keyof typeof obra.organizacao_seguranca] as SimNaoParcialNA} onChange={(v) => updateNested('organizacao_seguranca', { [key]: v })} />
              </div>
            ))}
          </div>
          <div className="space-y-2"><Label>Observações de segurança</Label><Textarea value={obra.organizacao_seguranca.observacoes} onChange={(e) => updateNested('organizacao_seguranca', { observacoes: e.target.value })} /></div>
        </FieldBlock>

        <FieldBlock title="5. Resíduos da Obra">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['ha_residuos', 'Há resíduos gerados'],
              ['segregados', 'Resíduos segregados'],
              ['acondicionados', 'Acondicionados adequadamente'],
              ['ha_cacamba', 'Há caçamba ou local definido'],
              ['mistura_residuos', 'Mistura de resíduos'],
              ['residuos_espalhados', 'Resíduos espalhados'],
              ['residuos_perigosos', 'Resíduos perigosos ou contaminados'],
              ['houve_coleta', 'Houve coleta desde a última visita'],
              ['comprovante_destinacao', 'Há comprovante de destinação'],
            ].map(([key, label]) => (
              <div key={key as string} className="space-y-2">
                <Label>{label}</Label>
                <ToggleResposta value={obra.residuos[key as keyof typeof obra.residuos] as SimNaoParcialNA} onChange={(v) => updateNested('residuos', { [key]: v })} />
              </div>
            ))}
          </div>
          <div className="space-y-2"><Label>Tipos de resíduos observados</Label><Input value={obra.residuos.tipos_observados} onChange={(e) => updateNested('residuos', { tipos_observados: e.target.value })} /></div>
          <div className="space-y-2"><Label>Destinação observada</Label><Input value={obra.residuos.destinacao_observada} onChange={(e) => updateNested('residuos', { destinacao_observada: e.target.value })} /></div>
          <div className="space-y-2"><Label>Responsável pela coleta / destinação</Label><Input value={obra.residuos.responsavel_coleta} onChange={(e) => updateNested('residuos', { responsavel_coleta: e.target.value })} /></div>
          <div className="space-y-2"><Label>Observações sobre resíduos</Label><Textarea value={obra.residuos.observacoes} onChange={(e) => updateNested('residuos', { observacoes: e.target.value })} /></div>
        </FieldBlock>

        <FieldBlock title="6. Efluentes, Água e Drenagem">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['acumulo_agua', 'Acúmulo de água'],
              ['drenagem_provisoria', 'Drenagem provisória'],
              ['erosao_escoamento', 'Erosão por escoamento'],
              ['lancamento_irregular', 'Lançamento irregular de água ou efluente'],
              ['lama_via_publica', 'Lama ou carreamento para via pública'],
              ['protecao_bocas_lobo', 'Proteção de bocas de lobo'],
              ['banheiro_quimico', 'Banheiro químico / estrutura sanitária'],
              ['vazamento', 'Vazamento'],
              ['odor_extravasamento', 'Odor ou extravasamento'],
              ['registro_coleta_manutencao', 'Registro de coleta / manutenção'],
            ].map(([key, label]) => (
              <div key={key as string} className="space-y-2">
                <Label>{label}</Label>
                <ToggleResposta value={obra.efluentes[key as keyof typeof obra.efluentes] as SimNaoParcialNA} onChange={(v) => updateNested('efluentes', { [key]: v })} />
              </div>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2"><Label>Uso de água</Label><Input value={obra.efluentes.uso_agua} onChange={(e) => updateNested('efluentes', { uso_agua: e.target.value })} /></div>
            <div className="space-y-2"><Label>Origem da água</Label><Input value={obra.efluentes.origem_agua} onChange={(e) => updateNested('efluentes', { origem_agua: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Destinação de efluentes sanitários</Label><Input value={obra.efluentes.destinacao_efluentes} onChange={(e) => updateNested('efluentes', { destinacao_efluentes: e.target.value })} /></div>
          <div className="space-y-2"><Label>Observações sobre água e drenagem</Label><Textarea value={obra.efluentes.observacoes} onChange={(e) => updateNested('efluentes', { observacoes: e.target.value })} /></div>
        </FieldBlock>

        <FieldBlock title="7. Não Conformidades e Pendências">
          <div className="space-y-3">
            <p className="text-sm font-medium">Não conformidades</p>
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Tipo" value={novaNc.tipo} onChange={(e) => setNovaNc(prev => ({ ...prev, tipo: e.target.value }))} />
              <Input placeholder="Descrição" value={novaNc.descricao} onChange={(e) => setNovaNc(prev => ({ ...prev, descricao: e.target.value }))} />
              <Input placeholder="Responsável" value={novaNc.responsavel} onChange={(e) => setNovaNc(prev => ({ ...prev, responsavel: e.target.value }))} />
              <Input placeholder="Prazo" value={novaNc.prazo} onChange={(e) => setNovaNc(prev => ({ ...prev, prazo: e.target.value }))} />
              <Select value={novaNc.gravidade} onValueChange={gravidade => setNovaNc(prev => ({ ...prev, gravidade: gravidade as NaoConformidadeObra['gravidade'] }))}><SelectTrigger><SelectValue placeholder="Gravidade" /></SelectTrigger><SelectContent><SelectItem value="BAIXA">Baixa</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="ALTA">Alta</SelectItem></SelectContent></Select>
              <Select value={novaNc.status} onValueChange={status => setNovaNc(prev => ({ ...prev, status: status as NaoConformidadeObra['status'] }))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem><SelectItem value="CONCLUIDO">Concluído</SelectItem></SelectContent></Select>
            </div>
            <div className="flex flex-wrap items-center gap-4"><label className="flex items-center gap-2 text-sm"><Checkbox checked={novaNc.acao_imediata} onCheckedChange={acao_imediata => setNovaNc(prev => ({ ...prev, acao_imediata: Boolean(acao_imediata) }))} />Requer ação imediata</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={novaNc.foto_vinculada} onCheckedChange={foto_vinculada => setNovaNc(prev => ({ ...prev, foto_vinculada: Boolean(foto_vinculada), foto_id: foto_vinculada ? prev.foto_id : undefined }))} />Vincular foto</label>{novaNc.foto_vinculada && <Select value={novaNc.foto_id} onValueChange={foto_id => setNovaNc(prev => ({ ...prev, foto_id }))}><SelectTrigger className="w-44"><SelectValue placeholder="Foto da visita" /></SelectTrigger><SelectContent>{data.fotos.map((foto, i) => <SelectItem key={foto.fotoId ?? foto.url} value={foto.fotoId ?? foto.url}>Foto {i + 1} ({foto.tipo})</SelectItem>)}</SelectContent></Select>}</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleAddNc}><Plus className="h-4 w-4 mr-2" />Adicionar NC</Button>
            </div>
            <div className="space-y-2">
              {obra.nao_conformidades.map((nc, index) => (
                <div key={nc.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{nc.tipo || 'Sem tipo'}</p>
                    <p className="text-xs text-muted-foreground">{nc.descricao}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeNaoConformidade(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium">Pendências</p>
            <div className="grid gap-2 md:grid-cols-2">
              <Input placeholder="Descrição" value={novaPendencia.descricao} onChange={(e) => setNovaPendencia(prev => ({ ...prev, descricao: e.target.value }))} />
              <Input placeholder="Responsável" value={novaPendencia.responsavel} onChange={(e) => setNovaPendencia(prev => ({ ...prev, responsavel: e.target.value }))} />
              <Input placeholder="Prazo" value={novaPendencia.prazo} onChange={(e) => setNovaPendencia(prev => ({ ...prev, prazo: e.target.value }))} />
              <Select value={novaPendencia.prioridade} onValueChange={prioridade => setNovaPendencia(prev => ({ ...prev, prioridade: prioridade as PendenciaObra['prioridade'] }))}><SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger><SelectContent><SelectItem value="BAIXA">Baixa</SelectItem><SelectItem value="MEDIA">Média</SelectItem><SelectItem value="ALTA">Alta</SelectItem></SelectContent></Select>
              <Select value={novaPendencia.status} onValueChange={status => setNovaPendencia(prev => ({ ...prev, status: status as PendenciaObra['status'] }))}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="PENDENTE">Pendente</SelectItem><SelectItem value="EM_ANDAMENTO">Em andamento</SelectItem><SelectItem value="CONCLUIDO">Concluído</SelectItem></SelectContent></Select>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddPendencia}><Plus className="h-4 w-4 mr-2" />Adicionar pendência</Button>
            <div className="space-y-2">
              {obra.pendencias.map((p, index) => (
                <div key={p.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{p.descricao}</p>
                    <p className="text-xs text-muted-foreground">{p.responsavel} • {p.prazo}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removePendenciaObra(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </FieldBlock>

        <FieldBlock title="Ficha fotográfica">
          <div className="flex flex-wrap gap-2">
            {['Placa da obra', 'Vista geral da obra', 'Frente de serviço', 'Área construída atual', 'Escavação / terraplenagem', 'Estrutura / concretagem', 'Drenagem', 'Armazenamento de materiais', 'Resíduos da obra', 'Interferência ambiental', 'Vizinhança impactada', 'Acesso de máquinas e caminhões', 'Antes da intervenção', 'Depois da intervenção', 'Não conformidade', 'Correção realizada'].map((item) => (
              <Badge key={item} variant={obra.foto_itens.includes(item) ? 'default' : 'secondary'} className={cn('cursor-pointer', obra.foto_itens.includes(item) && 'bg-primary text-primary-foreground')} onClick={() => updateObra({ foto_itens: obra.foto_itens.includes(item) ? obra.foto_itens.filter(i => i !== item) : [...obra.foto_itens, item] })}>
                {item}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" /> Toque nos itens que a equipe precisa fotografar ou já registrou.
          </div>
        </FieldBlock>
      </div>

      <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-4 py-3">
        <Button className="w-full h-14 text-base" onClick={handleFinalizar} disabled={saveAtendimento.isPending}>
          Finalizar acompanhamento
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </MobileLayout>
  );
}
