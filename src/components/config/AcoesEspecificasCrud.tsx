import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAcoesEspecificasConfig,
  useUpsertAcaoEspecifica,
  useDeleteAcaoEspecifica,
  usePlanos,
  useTopicos,
  useSubtopicos,
} from '@/hooks/useConfigEntities';

export function AcoesEspecificasCrud() {
  const { data: acoes, isLoading } = useAcoesEspecificasConfig();
  const { data: planos } = usePlanos();
  const { data: topicos } = useTopicos();
  const upsert = useUpsertAcaoEspecifica();
  const del = useDeleteAcaoEspecifica();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nome: '', plano_id: '', topico_id: '', subtopico_id: '' });

  const { data: subtopicos } = useSubtopicos();

  const openNew = () => {
    setEditing(null);
    setForm({ nome: '', plano_id: '', topico_id: '', subtopico_id: '' });
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      nome: a.nome,
      plano_id: a.plano_id || '',
      topico_id: a.topico_id || '',
      subtopico_id: a.subtopico_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório'); return; }
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        nome: form.nome.trim(),
        plano_id: form.plano_id || null,
        topico_id: form.topico_id || null,
        subtopico_id: form.subtopico_id || null,
      });
      setDialogOpen(false);
      toast.success(editing ? 'Ação atualizada' : 'Ação criada');
    } catch (e: any) {
      toast.error(e?.message?.includes('duplicate') ? 'Já existe uma ação com esse nome' : 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success('Ação removida');
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
        <h3 className="text-lg font-semibold">Ações Específicas</h3>
        <Button size="sm" onClick={openNew} className="gap-1">
          <Plus className="h-4 w-4" /> Nova Ação
        </Button>
      </div>

      <div className="space-y-2">
        {acoes?.map((a: any) => (
          <Card key={a.id} className="group">
            <CardContent className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.nome}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {a.planos && (
                    <Badge variant="outline" className="text-[10px] px-1.5" style={{ borderColor: a.planos.cor, color: a.planos.cor }}>
                      {a.planos.nome}
                    </Badge>
                  )}
                  {a.topicos?.nome && (
                    <Badge variant="secondary" className="text-[10px]">
                      {a.topicos.nome}{a.subtopicos?.nome ? ` › ${a.subtopicos.nome}` : ''}
                    </Badge>
                  )}
                  {a.ativo === false && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!acoes || acoes.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação cadastrada</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Ação' : 'Nova Ação'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Verificar operação em campo" />
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
