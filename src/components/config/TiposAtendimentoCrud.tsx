import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTiposAtendimentoConfig,
  useUpsertTipoAtendimento,
  useDeleteTipoAtendimento,
  usePlanos,
  useTopicos,
  useSubtopicos,
} from '@/hooks/useConfigEntities';

export function TiposAtendimentoCrud() {
  const { data: tipos, isLoading } = useTiposAtendimentoConfig();
  const { data: planos } = usePlanos();
  const { data: topicos } = useTopicos();
  const upsert = useUpsertTipoAtendimento();
  const del = useDeleteTipoAtendimento();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', descricao: '', plano_id: '', topico_id: '', subtopico_id: '' });

  const { data: subtopicos } = useSubtopicos();

  const openNew = () => {
    setEditing(null);
    setForm({ nome: '', descricao: '', plano_id: '', topico_id: '', subtopico_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      nome: t.nome,
      descricao: t.descricao || '',
      plano_id: t.plano_id || '',
      topico_id: t.topico_id || '',
      subtopico_id: t.subtopico_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        plano_id: form.plano_id || null,
        topico_id: form.topico_id || null,
        subtopico_id: form.subtopico_id || null,
      });
      setDialogOpen(false);
      toast.success(editing ? 'Tipo atualizado' : 'Tipo criado');
    } catch (e: any) {
      toast.error(e?.message?.includes('duplicate') ? 'Já existe um tipo com esse nome' : 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success('Tipo removido');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tipos de Atendimento</h3>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> Novo Tipo
        </Button>
      </div>

      <div className="space-y-2">
        {tipos?.map((t: any) => (
          <Card key={t.id} className="group">
            <CardContent className="flex items-start gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{t.nome}</p>
                {t.descricao && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.descricao}</p>}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {t.planos && (
                    <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: t.planos.cor, color: t.planos.cor }}>
                      {t.planos.nome}
                    </Badge>
                  )}
                  {t.topicos?.nome && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t.topicos.nome}{t.subtopicos?.nome ? ` › ${t.subtopicos.nome}` : ''}
                    </Badge>
                  )}
                  {t.ativo === false && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!tipos || tipos.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum tipo cadastrado</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Tipo' : 'Novo Tipo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Acompanhamento Ambiental" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição mostrada nos cards de seleção..." rows={3} />
            </div>
            <div>
              <Label>Plano</Label>
              <Select value={form.plano_id} onValueChange={v => setForm(f => ({ ...f, plano_id: v === 'none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar plano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {planos?.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tópico</Label>
                <Select value={form.topico_id} onValueChange={v => setForm(f => ({ ...f, topico_id: v === 'none' ? '' : v, subtopico_id: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar tópico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {topicos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subtópico</Label>
                <Select value={form.subtopico_id} onValueChange={v => setForm(f => ({ ...f, subtopico_id: v === 'none' ? '' : v }))} disabled={!form.topico_id}>
                  <SelectTrigger><SelectValue placeholder={form.topico_id ? 'Selecionar subtópico' : 'Selecione tópico primeiro'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {subtopicos?.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
