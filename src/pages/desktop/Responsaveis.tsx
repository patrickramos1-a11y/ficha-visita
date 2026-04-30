import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Pencil, Trash2, UserCog, Loader2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsavelForm { nome: string; ativo: boolean; }

export default function DesktopResponsaveis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResponsavel, setEditingResponsavel] = useState<{ id: string } & ResponsavelForm | null>(null);
  const [form, setForm] = useState<ResponsavelForm>({ nome: '', ativo: true });

  const { data: responsaveis, isLoading } = useQuery({
    queryKey: ['desktop-responsaveis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('responsaveis').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResponsavelForm) => {
      const { error } = await supabase.from('responsaveis').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-responsaveis'] });
      toast({ title: 'Responsável criado!' });
      setIsDialogOpen(false);
      setForm({ nome: '', ativo: true });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & ResponsavelForm) => {
      const { error } = await supabase.from('responsaveis').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-responsaveis'] });
      toast({ title: 'Responsável atualizado!' });
      setIsDialogOpen(false);
      setEditingResponsavel(null);
      setForm({ nome: '', ativo: true });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('responsaveis').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-responsaveis'] });
      toast({ title: 'Responsável removido!' });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const filteredResponsaveis = responsaveis?.filter(r => r.nome.toLowerCase().includes(search.toLowerCase())) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    editingResponsavel ? updateMutation.mutate({ id: editingResponsavel.id, ...form }) : createMutation.mutate(form);
  };

  const openEditDialog = (r: { id: string; nome: string; ativo: boolean }) => {
    setEditingResponsavel({ id: r.id, nome: r.nome, ativo: r.ativo });
    setForm({ nome: r.nome, ativo: r.ativo });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingResponsavel(null);
    setForm({ nome: '', ativo: true });
    setIsDialogOpen(true);
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('responsaveis').update({ ativo: !ativo }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['desktop-responsaveis'] });
    toast({ title: ativo ? 'Desativado' : 'Ativado' });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <DesktopLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
              {!isMobile && <UserCog className="h-6 w-6 text-primary shrink-0" />}
              Responsáveis
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {responsaveis?.length || 0} cadastrado{responsaveis?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size={isMobile ? "sm" : "default"} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                {isMobile ? 'Novo' : 'Novo Responsável'}
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? "max-w-[calc(100vw-32px)]" : ""}>
              <DialogHeader><DialogTitle>{editingResponsavel ? 'Editar' : 'Novo'} Responsável</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={form.nome} onChange={(e) => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" required />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ativo">Ativo</Label>
                  <Switch id="ativo" checked={form.ativo} onCheckedChange={(c) => setForm(p => ({ ...p, ativo: c }))} />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingResponsavel ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredResponsaveis.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum responsável encontrado</div>
        ) : isMobile ? (
          <div className="space-y-2">
            {filteredResponsaveis.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{r.nome}</p>
                    <Badge variant={r.ativo ? 'default' : 'secondary'} className={`text-[10px] h-5 px-1.5 mt-1 ${r.ativo ? 'bg-primary/10 text-primary' : ''}`}>
                      {r.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={r.ativo} onCheckedChange={() => toggleAtivo(r.id, r.ativo)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(r)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={isMobile ? "max-w-[calc(100vw-32px)]" : ""}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover?</AlertDialogTitle>
                          <AlertDialogDescription>"{r.nome}" será removido.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(r.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-card border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredResponsaveis.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell>
                      <Badge variant={r.ativo ? 'default' : 'secondary'} className={r.ativo ? 'bg-primary/10 text-primary' : ''}>
                        {r.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch checked={r.ativo} onCheckedChange={() => toggleAtivo(r.id, r.ativo)} />
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(r)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Remover?</AlertDialogTitle><AlertDialogDescription>"{r.nome}" será removido.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(r.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
