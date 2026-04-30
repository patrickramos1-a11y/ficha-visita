import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useDemandasEspecificas, useUpsertDemandaEspecifica, useDeleteDemandaEspecifica } from '@/hooks/useConfigEntities';
import { usePlanos, useTopicos, useSubtopicos } from '@/hooks/useConfigEntities';

export function DemandasEspecificasCrud() {
  const [filterPlano, setFilterPlano] = useState<string>('');
  const [filterTopico, setFilterTopico] = useState<string>('');
  const { data: demandas, isLoading } = useDemandasEspecificas({
    plano_id: filterPlano || undefined,
    topico_id: filterTopico || undefined,
  });
  const { data: planos } = usePlanos();
  const { data: topicos } = useTopicos();
  const { data: subtopicos } = useSubtopicos();
  const upsert = useUpsertDemandaEspecifica();
  const deleteMut = useDeleteDemandaEspecifica();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    nome_curto: '',
    descricao_detalhada: '',
    plano_id: '',
    topico_id: '',
    subtopico_id: '',
  });

  const filteredSubtopicos = subtopicos?.filter(s => !form.topico_id || s.topico_id === form.topico_id);

  const openNew = () => {
    setEditing(null);
    setForm({ nome_curto: '', descricao_detalhada: '', plano_id: '', topico_id: '', subtopico_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (d: any) => {
    setEditing(d);
    setForm({
      nome_curto: d.nome_curto,
      descricao_detalhada: d.descricao_detalhada || '',
      plano_id: d.plano_id || '',
      topico_id: d.topico_id || '',
      subtopico_id: d.subtopico_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome_curto.trim()) { toast.error('Nome curto é obrigatório'); return; }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        nome_curto: form.nome_curto.trim(),
        descricao_detalhada: form.descricao_detalhada.trim() || undefined,
        plano_id: form.plano_id || null,
        topico_id: form.topico_id || null,
        subtopico_id: form.subtopico_id || null,
      });
      setDialogOpen(false);
      toast.success(editing ? 'Demanda atualizada' : 'Demanda criada');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success('Demanda removida');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Demandas Específicas</h3>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> Nova Demanda
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterPlano} onValueChange={setFilterPlano}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Todos os planos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os planos</SelectItem>
            {planos?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterTopico} onValueChange={setFilterTopico}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue placeholder="Todos os tópicos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tópicos</SelectItem>
            {topicos?.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(filterPlano || filterTopico) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterPlano(''); setFilterTopico(''); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* List */}
      <div className="space-y-2">
        {demandas?.map(d => (
          <Card key={d.id} className="group">
            <CardContent className="flex items-start gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{d.nome_curto}</p>
                {d.descricao_detalhada && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.descricao_detalhada}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {d.planos && (
                    <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: (d.planos as any).cor, color: (d.planos as any).cor }}>
                      {(d.planos as any).nome}
                    </Badge>
                  )}
                  {d.topicos && <Badge variant="secondary" className="text-[10px] px-1.5">{(d.topicos as any).nome}</Badge>}
                  {d.subtopicos && <Badge variant="secondary" className="text-[10px] px-1.5">{(d.subtopicos as any).nome}</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(d)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!demandas || demandas.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma demanda cadastrada</p>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Demanda' : 'Nova Demanda'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Curto *</Label>
              <Input value={form.nome_curto} onChange={e => setForm(f => ({ ...f, nome_curto: e.target.value }))} placeholder="Ex: Acompanhar obra da ETE" />
            </div>
            <div>
              <Label>Descrição Detalhada</Label>
              <Textarea value={form.descricao_detalhada} onChange={e => setForm(f => ({ ...f, descricao_detalhada: e.target.value }))} placeholder="Descrição completa para Excel e PDF..." rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label>Plano</Label>
                <Select value={form.plano_id} onValueChange={v => setForm(f => ({ ...f, plano_id: v === 'none' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {planos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tópico</Label>
                <Select value={form.topico_id} onValueChange={v => setForm(f => ({ ...f, topico_id: v === 'none' ? '' : v, subtopico_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {topicos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subtópico</Label>
                <Select value={form.subtopico_id} onValueChange={v => setForm(f => ({ ...f, subtopico_id: v === 'none' ? '' : v }))} disabled={!form.topico_id}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {filteredSubtopicos?.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
