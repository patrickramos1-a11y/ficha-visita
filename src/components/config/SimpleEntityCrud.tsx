import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Entity {
  id: string;
  nome: string;
  ativo?: boolean;
  cor?: string;
}

interface SimpleEntityCrudProps {
  title: string;
  entities: Entity[] | undefined;
  isLoading: boolean;
  onSave: (entity: { id?: string; nome: string; cor?: string; ativo?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showColor?: boolean;
  isSaving?: boolean;
}

export function SimpleEntityCrud({ 
  title, entities, isLoading, onSave, onDelete, showColor, isSaving 
}: SimpleEntityCrudProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#188840');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#188840');

  const handleSave = async (id?: string) => {
    const nome = id ? editName : newName;
    const cor = id ? editColor : newColor;
    if (!nome.trim()) return;
    try {
      await onSave({ id, nome: nome.trim(), cor: showColor ? cor : undefined });
      if (id) setEditingId(null);
      else { setIsAdding(false); setNewName(''); }
      toast.success(id ? 'Atualizado com sucesso' : 'Criado com sucesso');
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success('Removido com sucesso');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const startEdit = (e: Entity) => {
    setEditingId(e.id);
    setEditName(e.nome);
    setEditColor(e.cor || '#188840');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardContent className="flex items-center gap-2 p-3">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome..." className="flex-1" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave()} />
            {showColor && <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />}
            <Button size="icon" variant="ghost" onClick={() => handleSave()} disabled={isSaving}><Check className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => { setIsAdding(false); setNewName(''); }}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-1">
        {entities?.map(entity => (
          <div key={entity.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group">
            {editingId === entity.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8" autoFocus onKeyDown={e => e.key === 'Enter' && handleSave(entity.id)} />
                {showColor && <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />}
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSave(entity.id)} disabled={isSaving}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                {showColor && entity.cor && (
                  <div className="h-4 w-4 rounded-full shrink-0 border" style={{ backgroundColor: entity.cor }} />
                )}
                <span className="flex-1 text-sm">{entity.nome}</span>
                {entity.ativo === false && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => startEdit(entity)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDelete(entity.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
        {(!entities || entities.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum item cadastrado</p>
        )}
      </div>
    </div>
  );
}
