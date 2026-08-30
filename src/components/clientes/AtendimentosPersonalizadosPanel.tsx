import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Copy, FileSliders, Layers3, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { supabase } from '@/integrations/supabase/client';
import {
  useAtendimentoPersonalizadoDetalhe,
  useAtendimentosPersonalizados,
  useDeletePersonalizadoChild,
  useUpsertAtendimentoPersonalizado,
  useUpsertPersonalizadoChild,
  type PersonalizadoCadastro,
} from '@/hooks/useAtendimentosPersonalizados';

type ClienteOption = { id: string; nome: string };

const COLORS = ['emerald', 'sky', 'amber', 'rose', 'violet', 'slate'];

export function AtendimentosPersonalizadosPanel({ clientes }: { clientes: ClienteOption[] }) {
  const [selectedClienteId, setSelectedClienteId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [baseForm, setBaseForm] = useState({
    nome: '',
    descricao: '',
    status: 'ativo',
    frequencia: '',
    responsavel_padrao_id: '',
    observacoes: '',
  });
  const [tipoNome, setTipoNome] = useState('');
  const [acaoNome, setAcaoNome] = useState('');
  const [moduloTitulo, setModuloTitulo] = useState('');
  const [itemForm, setItemForm] = useState({ modulo_id: '', texto: '', exige_foto: false, permite_observacao: true, entra_conformidade: true });

  const { data: responsaveis = [] } = useResponsaveis();
  const { data: personalizados = [], isLoading } = useAtendimentosPersonalizados(selectedClienteId || undefined);
  const { data: detalhe } = useAtendimentoPersonalizadoDetalhe(selectedId);
  const { data: indicadores } = useQuery({
    queryKey: ['atendimento-personalizado-indicadores', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('atendimentos')
        .select('id, titulo, data_inicio, percentual_conformidade')
        .eq('atendimento_personalizado_id', selectedId)
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      const rows = data ?? [];
      const percentages = rows
        .map((row: any) => typeof row.percentual_conformidade === 'number' ? row.percentual_conformidade : null)
        .filter((value: number | null): value is number => value !== null);
      return {
        total: rows.length,
        ultima: rows[0] ?? null,
        media: percentages.length ? Math.round(percentages.reduce((sum: number, value: number) => sum + value, 0) / percentages.length) : null,
        menor: percentages.length ? Math.min(...percentages) : null,
      };
    },
    retry: 1,
  });
  const upsertBase = useUpsertAtendimentoPersonalizado();
  const upsertTipo = useUpsertPersonalizadoChild('atendimento_personalizado_tipos');
  const upsertAcao = useUpsertPersonalizadoChild('atendimento_personalizado_acoes');
  const upsertModulo = useUpsertPersonalizadoChild('atendimento_personalizado_modulos');
  const upsertItem = useUpsertPersonalizadoChild('atendimento_personalizado_itens');
  const deleteTipo = useDeletePersonalizadoChild('atendimento_personalizado_tipos');
  const deleteAcao = useDeletePersonalizadoChild('atendimento_personalizado_acoes');
  const deleteModulo = useDeletePersonalizadoChild('atendimento_personalizado_modulos');
  const deleteItem = useDeletePersonalizadoChild('atendimento_personalizado_itens');

  useEffect(() => {
    if (!selectedClienteId && clientes[0]) setSelectedClienteId(clientes[0].id);
  }, [clientes, selectedClienteId]);

  useEffect(() => {
    if (detalhe) {
      setBaseForm({
        nome: detalhe.nome ?? '',
        descricao: detalhe.descricao ?? '',
        status: detalhe.status ?? 'ativo',
        frequencia: detalhe.frequencia ?? '',
        responsavel_padrao_id: detalhe.responsavel_padrao_id ?? '',
        observacoes: detalhe.observacoes ?? '',
      });
    }
  }, [detalhe]);

  const selectedCliente = useMemo(() => clientes.find((cliente) => cliente.id === selectedClienteId), [clientes, selectedClienteId]);

  const resetForNew = () => {
    setSelectedId(null);
    setBaseForm({ nome: '', descricao: '', status: 'ativo', frequencia: '', responsavel_padrao_id: '', observacoes: '' });
  };

  const saveBase = async () => {
    if (!selectedClienteId || !baseForm.nome.trim()) {
      toast.error('Informe o cliente e o nome da ficha');
      return;
    }
    try {
      const id = await upsertBase.mutateAsync({
        id: selectedId ?? undefined,
        cliente_id: selectedClienteId,
        nome: baseForm.nome.trim(),
        descricao: baseForm.descricao,
        status: baseForm.status,
        frequencia: baseForm.frequencia,
        responsavel_padrao_id: baseForm.responsavel_padrao_id === 'none' ? null : baseForm.responsavel_padrao_id,
        observacoes: baseForm.observacoes,
      });
      setSelectedId(id);
      toast.success('Ficha personalizada salva');
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar a ficha');
    }
  };

  const addTipo = async () => {
    if (!selectedId || !tipoNome.trim()) return;
    await upsertTipo.mutateAsync({
      atendimento_personalizado_id: selectedId,
      nome: tipoNome.trim(),
      cor: COLORS[(detalhe?.tipos?.length ?? 0) % COLORS.length],
      ordem: detalhe?.tipos?.length ?? 0,
      ativo: true,
    });
    setTipoNome('');
  };

  const addAcao = async () => {
    if (!selectedId || !acaoNome.trim()) return;
    await upsertAcao.mutateAsync({
      atendimento_personalizado_id: selectedId,
      nome: acaoNome.trim(),
      cor: COLORS[(detalhe?.acoes?.length ?? 0) % COLORS.length],
      ordem: detalhe?.acoes?.length ?? 0,
      ativo: true,
    });
    setAcaoNome('');
  };

  const addModulo = async () => {
    if (!selectedId || !moduloTitulo.trim()) return;
    await upsertModulo.mutateAsync({
      atendimento_personalizado_id: selectedId,
      titulo: moduloTitulo.trim(),
      ordem: detalhe?.modulos?.length ?? 0,
      entra_conformidade: true,
      ativo: true,
    });
    setModuloTitulo('');
  };

  const addItem = async () => {
    if (!itemForm.modulo_id || !itemForm.texto.trim()) return;
    const module = detalhe?.modulos?.find((modulo: any) => modulo.id === itemForm.modulo_id);
    await upsertItem.mutateAsync({
      modulo_id: itemForm.modulo_id,
      texto: itemForm.texto.trim(),
      tipo_resposta: 'CONFORMIDADE',
      exige_foto: itemForm.exige_foto,
      permite_observacao: itemForm.permite_observacao,
      entra_conformidade: itemForm.entra_conformidade,
      ordem: module?.itens?.length ?? 0,
      ativo: true,
    });
    setItemForm((current) => ({ ...current, texto: '', exige_foto: false }));
  };

  const openFicha = (ficha: PersonalizadoCadastro) => {
    setSelectedId(ficha.id);
    setSelectedClienteId(ficha.cliente_id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span className="flex items-center gap-2"><FileSliders className="h-5 w-5 text-primary" />Atendimentos personalizados</span>
          <Button type="button" size="sm" variant="outline" className="gap-2" onClick={resetForNew}><Plus className="h-4 w-4" />Nova ficha</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={selectedClienteId} onValueChange={(value) => { setSelectedClienteId(value); setSelectedId(null); }}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground">Carregando fichas...</p> : personalizados.length ? personalizados.map((ficha) => (
              <button
                key={ficha.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedId === ficha.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted'}`}
                onClick={() => openFicha(ficha)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{ficha.nome}</p>
                  <Badge variant={ficha.status === 'ativo' ? 'secondary' : 'outline'}>{ficha.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ficha.frequencia || 'Sem frequência definida'}</p>
              </button>
            )) : (
              <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                {selectedCliente?.nome ? 'Nenhuma ficha cadastrada para este cliente.' : 'Selecione um cliente.'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome da ficha</Label>
              <Input value={baseForm.nome} onChange={(event) => setBaseForm({ ...baseForm, nome: event.target.value })} placeholder="Ex.: Inspeção PCA - Posto Av. Brasil" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={baseForm.status} onValueChange={(status) => setBaseForm({ ...baseForm, status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Input value={baseForm.frequencia} onChange={(event) => setBaseForm({ ...baseForm, frequencia: event.target.value })} placeholder="Ex.: mensal" />
            </div>
            <div className="space-y-2">
              <Label>Responsável padrão</Label>
              <Select value={baseForm.responsavel_padrao_id || 'none'} onValueChange={(responsavel_padrao_id) => setBaseForm({ ...baseForm, responsavel_padrao_id })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável padrão</SelectItem>
                  {responsaveis.map((responsavel) => <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea value={baseForm.descricao} onChange={(event) => setBaseForm({ ...baseForm, descricao: event.target.value })} placeholder="Descrição da ficha personalizada" />
          <Textarea value={baseForm.observacoes} onChange={(event) => setBaseForm({ ...baseForm, observacoes: event.target.value })} placeholder="Observações específicas do cliente" />
          <Button type="button" onClick={saveBase} disabled={upsertBase.isPending}>{upsertBase.isPending ? 'Salvando...' : 'Salvar ficha'}</Button>

          {selectedId ? (
            <>
            <div className="grid gap-2 sm:grid-cols-4">
              <Metric label="Execuções" value={indicadores?.total ?? 0} />
              <Metric label="Média" value={indicadores?.media === null || indicadores?.media === undefined ? 'N/A' : `${indicadores.media}%`} />
              <Metric label="Menor" value={indicadores?.menor === null || indicadores?.menor === undefined ? 'N/A' : `${indicadores.menor}%`} />
              <Metric label="Última" value={indicadores?.ultima?.data_inicio ? new Date(indicadores.ultima.data_inicio).toLocaleDateString('pt-BR') : 'Sem registro'} />
            </div>
            <Tabs defaultValue="tipos" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tipos">Tipos</TabsTrigger>
                <TabsTrigger value="acoes">Ações</TabsTrigger>
                <TabsTrigger value="modulos">Módulos</TabsTrigger>
                <TabsTrigger value="itens">Itens</TabsTrigger>
              </TabsList>
              <TabsContent value="tipos" className="space-y-3">
                <InlineAdd value={tipoNome} onChange={setTipoNome} onAdd={addTipo} placeholder="Novo tipo específico" />
                <SimpleList items={detalhe?.tipos ?? []} onDelete={(id) => deleteTipo.mutate(id)} icon={<Pencil className="h-3.5 w-3.5" />} />
              </TabsContent>
              <TabsContent value="acoes" className="space-y-3">
                <InlineAdd value={acaoNome} onChange={setAcaoNome} onAdd={addAcao} placeholder="Nova ação específica" />
                <SimpleList items={detalhe?.acoes ?? []} onDelete={(id) => deleteAcao.mutate(id)} icon={<ListChecks className="h-3.5 w-3.5" />} />
              </TabsContent>
              <TabsContent value="modulos" className="space-y-3">
                <InlineAdd value={moduloTitulo} onChange={setModuloTitulo} onAdd={addModulo} placeholder="Novo módulo da inspeção" />
                <SimpleList items={detalhe?.modulos ?? []} labelKey="titulo" onDelete={(id) => deleteModulo.mutate(id)} icon={<Layers3 className="h-3.5 w-3.5" />} />
              </TabsContent>
              <TabsContent value="itens" className="space-y-3">
                <div className="grid gap-3 rounded-lg border p-3">
                  <Select value={itemForm.modulo_id} onValueChange={(modulo_id) => setItemForm({ ...itemForm, modulo_id })}>
                    <SelectTrigger><SelectValue placeholder="Módulo do item" /></SelectTrigger>
                    <SelectContent>
                      {(detalhe?.modulos ?? []).map((modulo: any) => <SelectItem key={modulo.id} value={modulo.id}>{modulo.titulo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea value={itemForm.texto} onChange={(event) => setItemForm({ ...itemForm, texto: event.target.value })} placeholder="Texto da pergunta/item de verificação" />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <ToggleLine label="Exige foto" checked={itemForm.exige_foto} onCheckedChange={(exige_foto) => setItemForm({ ...itemForm, exige_foto })} />
                    <ToggleLine label="Permite observação" checked={itemForm.permite_observacao} onCheckedChange={(permite_observacao) => setItemForm({ ...itemForm, permite_observacao })} />
                    <ToggleLine label="Entra no cálculo" checked={itemForm.entra_conformidade} onCheckedChange={(entra_conformidade) => setItemForm({ ...itemForm, entra_conformidade })} />
                  </div>
                  <Button type="button" onClick={addItem} className="w-fit gap-2"><Plus className="h-4 w-4" />Adicionar item</Button>
                </div>
                {(detalhe?.modulos ?? []).map((modulo: any) => (
                  <div key={modulo.id} className="space-y-2 rounded-lg border p-3">
                    <p className="text-sm font-semibold">{modulo.titulo}</p>
                    <SimpleList items={modulo.itens ?? []} labelKey="texto" onDelete={(id) => deleteItem.mutate(id)} icon={<Copy className="h-3.5 w-3.5" />} />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            </>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Salve ou selecione uma ficha para cadastrar tipos, ações, módulos e perguntas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function InlineAdd({ value, onChange, onAdd, placeholder }: { value: string; onChange: (value: string) => void; onAdd: () => void; placeholder: string }) {
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} onKeyDown={(event) => { if (event.key === 'Enter') onAdd(); }} />
      <Button type="button" size="icon" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
    </div>
  );
}

function ToggleLine({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      {label}
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}

function SimpleList({ items, labelKey = 'nome', onDelete, icon }: { items: any[]; labelKey?: string; onDelete: (id: string) => void; icon: ReactNode }) {
  if (!items.length) return <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nenhum item cadastrado.</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="truncate text-sm font-medium">{item[labelKey]}</span>
            {item.exige_foto ? <Badge variant="secondary" className="text-[10px]">foto</Badge> : null}
          </div>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
    </div>
  );
}
