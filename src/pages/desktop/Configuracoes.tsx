import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { SimpleEntityCrud } from '@/components/config/SimpleEntityCrud';
import { DemandasEspecificasCrud } from '@/components/config/DemandasEspecificasCrud';
import { TiposAtendimentoCrud } from '@/components/config/TiposAtendimentoCrud';
import { AcoesEspecificasCrud } from '@/components/config/AcoesEspecificasCrud';
import { UpdateCheckCard } from '@/components/pwa/UpdateCheckCard';
import { NaturezasVisitaCrud } from '@/components/config/NaturezasVisitaCrud';
import {
  usePlanos, useUpsertPlano, useDeletePlano,
  useTopicos, useUpsertTopico, useDeleteTopico,
  useSubtopicos, useUpsertSubtopico, useDeleteSubtopico,
  useOrigens, useUpsertOrigem, useDeleteOrigem,
  useStatusConfig, useUpsertStatusConfig, useDeleteStatusConfig,
} from '@/hooks/useConfigEntities';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ClientesCrud() {
  const { data: clientes, isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const qc = useQueryClient();

  const handleSave = async (e: { id?: string; nome: string }) => {
    if (e.id) {
      const { error } = await supabase.from('clientes').update({ nome: e.nome }).eq('id', e.id);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['clientes'] });
    } else {
      await createCliente.mutateAsync(e.nome);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['clientes'] });
  };

  return (
    <SimpleEntityCrud
      title="Empresas / Clientes"
      entities={clientes?.map(c => ({ id: c.id, nome: c.nome })) || []}
      isLoading={isLoading}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

function ResponsaveisCrud() {
  const { data: responsaveis, isLoading } = useResponsaveis();
  const qc = useQueryClient();

  const handleSave = async (e: { id?: string; nome: string }) => {
    if (e.id) {
      const { error } = await supabase.from('responsaveis').update({ nome: e.nome }).eq('id', e.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('responsaveis').insert({ nome: e.nome });
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: ['responsaveis'] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('responsaveis').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['responsaveis'] });
  };

  return (
    <SimpleEntityCrud
      title="Responsáveis"
      entities={responsaveis?.map(r => ({ id: r.id, nome: r.nome, ativo: r.ativo })) || []}
      isLoading={isLoading}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
}

function SubtopicosCrud() {
  const { data: subtopicos, isLoading } = useSubtopicos();
  const { data: topicos } = useTopicos();
  const upsert = useUpsertSubtopico();
  const del = useDeleteSubtopico();
  const [filterTopico, setFilterTopico] = useState<string>('');
  
  const filtered = filterTopico
    ? subtopicos?.filter(s => s.topico_id === filterTopico)
    : subtopicos;

  // Custom CRUD since subtopicos need topico_id selection
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTopicoId, setNewTopicoId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim() || !newTopicoId) { toast.error('Nome e tópico são obrigatórios'); return; }
    try {
      await upsert.mutateAsync({ nome: newName.trim(), topico_id: newTopicoId });
      setIsAdding(false); setNewName(''); setNewTopicoId('');
      toast.success('Subtópico criado');
    } catch { toast.error('Erro ao criar'); }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const sub = subtopicos?.find(s => s.id === id);
      await upsert.mutateAsync({ id, nome: editName.trim(), topico_id: sub?.topico_id || '' });
      setEditingId(null);
      toast.success('Atualizado');
    } catch { toast.error('Erro ao atualizar'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">Subtópicos</h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Novo
          </Button>
        )}
      </div>

      <Select value={filterTopico} onValueChange={v => setFilterTopico(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-[220px] h-8 text-xs">
          <SelectValue placeholder="Filtrar por tópico" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tópicos</SelectItem>
          {topicos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      {isAdding && (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome..." className="flex-1" autoFocus />
          <Select value={newTopicoId} onValueChange={setNewTopicoId}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tópico" /></SelectTrigger>
            <SelectContent>
              {topicos?.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={handleAdd}><Check className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { setIsAdding(false); setNewName(''); }}><X className="h-4 w-4" /></Button>
        </div>
      )}

      <div className="space-y-1">
        {filtered?.map(s => (
          <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group">
            {editingId === s.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="flex-1 h-8" autoFocus onKeyDown={e => e.key === 'Enter' && handleEdit(s.id)} />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(s.id)}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm">{s.nome}</span>
                <Badge variant="secondary" className="text-[10px]">{(s as any).topicos?.nome || '—'}</Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => { setEditingId(s.id); setEditName(s.nome); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => del.mutateAsync(s.id).then(() => toast.success('Removido')).catch(() => toast.error('Erro'))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        ))}
        {(!filtered || filtered.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum subtópico cadastrado</p>
        )}
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const isMobile = useIsMobile();
  const { data: planos, isLoading: loadPlanos } = usePlanos();
  const upsPlano = useUpsertPlano();
  const delPlano = useDeletePlano();

  const { data: topicos, isLoading: loadTopicos } = useTopicos();
  const upsTopic = useUpsertTopico();
  const delTopic = useDeleteTopico();

  const { data: origens, isLoading: loadOrigens } = useOrigens();
  const upsOrigem = useUpsertOrigem();
  const delOrigem = useDeleteOrigem();

  const { data: statusCfg, isLoading: loadStatus } = useStatusConfig();
  const upsStatus = useUpsertStatusConfig();
  const delStatus = useDeleteStatusConfig();

  const tabItems = [
    { value: 'empresas', label: 'Empresas' },
    { value: 'responsaveis', label: 'Responsáveis' },
    { value: 'tipos', label: 'Tipos' },
    { value: 'acoes', label: 'Ações' },
    { value: 'naturezas', label: 'Naturezas' },
    { value: 'origens', label: 'Origens' },
    { value: 'status', label: 'Status' },
    { value: 'demandas', label: 'Demandas' },
  ];

  return (
    <DesktopLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <UpdateCheckCard />
        <Tabs defaultValue="empresas">
          <TabsList className={isMobile ? "w-full flex-wrap h-auto gap-1 p-1" : "w-full justify-start"}>
            {tabItems.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className={isMobile ? "text-xs px-2 py-1.5" : ""}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Card className="mt-4">
            <CardContent className="p-4 sm:p-6">
              <TabsContent value="empresas" className="mt-0">
                <ClientesCrud />
              </TabsContent>

              <TabsContent value="responsaveis" className="mt-0">
                <ResponsaveisCrud />
              </TabsContent>

              <TabsContent value="tipos" className="mt-0">
                <TiposAtendimentoCrud />
              </TabsContent>

              <TabsContent value="acoes" className="mt-0">
                <AcoesEspecificasCrud />
              </TabsContent>

              <TabsContent value="naturezas" className="mt-0">
                <NaturezasVisitaCrud />
              </TabsContent>

              <TabsContent value="origens" className="mt-0">
                <SimpleEntityCrud
                  title="Origens"
                  entities={origens}
                  isLoading={loadOrigens}
                  onSave={async (e) => { await upsOrigem.mutateAsync(e); }}
                  onDelete={async (id) => { await delOrigem.mutateAsync(id); }}
                  isSaving={upsOrigem.isPending}
                />
              </TabsContent>

              <TabsContent value="status" className="mt-0">
                <SimpleEntityCrud
                  title="Status"
                  entities={statusCfg}
                  isLoading={loadStatus}
                  onSave={async (e) => { await upsStatus.mutateAsync(e); }}
                  onDelete={async (id) => { await delStatus.mutateAsync(id); }}
                  isSaving={upsStatus.isPending}
                />
              </TabsContent>

              <TabsContent value="demandas" className="mt-0">
                <DemandasEspecificasCrud />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </DesktopLayout>
  );
}
