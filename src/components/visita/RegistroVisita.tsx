import { useState } from 'react';
import { ClipboardList, MessageSquarePlus, Plus, Trash2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useAcoesEspecificasConfig, useTiposAtendimentoConfig } from '@/hooks/useConfigEntities';
import { VisitSelectionTile } from '@/components/visita/VisitSelectionTile';

export function RegistroVisita() {
  const { data, setTiposAtendimento, setAcoesEspecificas, addAnotacao, updateAnotacao, removeAnotacao, addDemanda, updateDemanda, removeDemanda } = useAtendimento();
  const { data: tipos = [] } = useTiposAtendimentoConfig();
  const { data: acoes = [] } = useAcoesEspecificasConfig();
  const [note, setNote] = useState('');
  const natureza = data.natureza ?? (data.modo === 'obras' ? 'OBRAS' : data.modo === 'ambiental' ? 'AMBIENTAL' : data.modo === 'processos' ? 'PROCESSOS' : 'ATENDIMENTO');

  const toggle = (items: string[], value: string, set: (next: string[]) => void) =>
    set(items.includes(value) ? items.filter(item => item !== value) : [...items, value]);
  const tiposNatureza = tipos.filter((item: any) => item.ativo !== false && (item.naturezas ?? ['ATENDIMENTO']).includes(natureza));
  const acoesNatureza = acoes.filter((item: any) => item.ativo !== false && (item.naturezas ?? ['ATENDIMENTO']).includes(natureza));
  const formatMeta = (item: any) => [item.topicos?.nome, item.subtopicos?.nome].filter(Boolean).join(' › ');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><ClipboardList className="h-4 w-4" />Tipos de atendimento</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {tiposNatureza.map((item: any) => {
            const selected = data.tipos_atendimento.includes(item.nome);
            return <VisitSelectionTile key={item.id} label={item.nome} selected={selected} onClick={() => toggle(data.tipos_atendimento, item.nome, setTiposAtendimento)} meta={formatMeta(item)} kind="tipo" />;
          })}
          {tiposNatureza.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">Nenhum tipo vinculado a esta natureza. Configure em Configurações.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Wrench className="h-4 w-4" />Ações realizadas</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          {acoesNatureza.map((item: any) => {
            const selected = data.acoes_especificas.includes(item.nome);
            return <VisitSelectionTile key={item.id} label={item.nome} selected={selected} onClick={() => toggle(data.acoes_especificas, item.nome, setAcoesEspecificas)} meta={formatMeta(item)} kind="acao" />;
          })}
          {acoesNatureza.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">Nenhuma ação vinculada a esta natureza. Configure em Configurações.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><MessageSquarePlus className="h-4 w-4" />Anotações</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2"><Textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Assunto para acompanhamento ou reunião..." /><Button type="button" size="icon" disabled={!note.trim()} onClick={() => { addAnotacao(note); setNote(''); }}><Plus className="h-4 w-4" /></Button></div>
          {(data.anotacoes_itens ?? []).map(item => <div key={item.id} className="flex gap-2"><Textarea value={item.texto} onChange={event => updateAnotacao(item.id, event.target.value)} /><Button type="button" variant="ghost" size="icon" onClick={() => removeAnotacao(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Demandas para o Radar Vital</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.demandas.map((item, index) => <div key={item.id ?? index} className="flex gap-2"><Input value={item.descricao} placeholder="Demanda levantada" onChange={event => updateDemanda(index, { ...item, descricao: event.target.value })} /><Button type="button" variant="ghost" size="icon" onClick={() => removeDemanda(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>)}
          <Button type="button" variant="outline" className="w-full" onClick={() => addDemanda({ descricao: '', personalizada: true, status: 'EM_EXECUCAO' })}><Plus className="mr-2 h-4 w-4" />Adicionar demanda</Button>
        </CardContent>
      </Card>
    </div>
  );
}
