import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Plus, Pencil, Trash2, Building2, Loader2, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClienteForm { nome: string; }

export default function DesktopClientes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<{ id: string; nome: string } | null>(null);
  const [form, setForm] = useState<ClienteForm>({ nome: '' });

  const { data: clientes, isLoading } = useQuery({
    queryKey: ['desktop-clientes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clientes').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClienteForm) => {
      const { error } = await supabase.from('clientes').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-clientes'] });
      toast({ title: 'Cliente criado!' });
      setIsDialogOpen(false);
      setForm({ nome: '' });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & ClienteForm) => {
      const { error } = await supabase.from('clientes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-clientes'] });
      toast({ title: 'Cliente atualizado!' });
      setIsDialogOpen(false);
      setEditingCliente(null);
      setForm({ nome: '' });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['desktop-clientes'] });
      toast({ title: 'Cliente removido!' });
    },
    onError: (error: Error) => toast({ title: 'Erro', description: error.message, variant: 'destructive' }),
  });

  const filteredClientes = clientes?.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return;
    editingCliente ? updateMutation.mutate({ id: editingCliente.id, ...form }) : createMutation.mutate(form);
  };

  const openEditDialog = (cliente: { id: string; nome: string }) => {
    setEditingCliente(cliente);
    setForm({ nome: cliente.nome });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCliente(null);
    setForm({ nome: '' });
    setIsDialogOpen(true);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <DesktopLayout>
      <div className="space-y-3 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
              {!isMobile && <Building2 className="h-6 w-6 text-primary shrink-0" />}
              Clientes
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {clientes?.length || 0} cadastrado{clientes?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog} size={isMobile ? "sm" : "default"} className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                {isMobile ? 'Novo' : 'Novo Cliente'}
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? "max-w-[calc(100vw-32px)]" : ""}>
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar' : 'Novo'} Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input id="nome" value={form.nome} onChange={(e) => setForm({ nome: e.target.value })} placeholder="Nome do cliente" required />
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCliente ? 'Salvar' : 'Criar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhum cliente encontrado</div>
        ) : isMobile ? (
          <div className="space-y-2">
            {filteredClientes.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{c.nome}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={isMobile ? "max-w-[calc(100vw-32px)]" : ""}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover?</AlertDialogTitle>
                          <AlertDialogDescription>"{c.nome}" será removido permanentemente.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
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
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(c.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover cliente?</AlertDialogTitle>
                              <AlertDialogDescription>"{c.nome}" será removido permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(c.id)} className="bg-destructive text-destructive-foreground">Remover</AlertDialogAction>
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
