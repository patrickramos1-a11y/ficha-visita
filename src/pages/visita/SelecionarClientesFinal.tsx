import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useClientes, useCreateCliente } from '@/hooks/useClientes';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { SelectionCard, SelectionChip, PageHeader, EmptyState, MobileFooter } from '@/components/mobile';
import { Search, ChevronRight, Users, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function SelecionarClientesFinal() {
  useVisitRoute('/visita/clientes');
  const navigate = useNavigate();
  const { data, addClienteId, removeClienteId } = useAtendimento();
  const { data: clientes, isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoNome, setNovoNome] = useState('');

  const filteredClientes = clientes?.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const selectedClientes = clientes?.filter(c => data.cliente_ids.includes(c.id)) || [];
  const availableClientes = filteredClientes.filter(c => !data.cliente_ids.includes(c.id));

  const toggleCliente = (id: string) => {
    if (data.cliente_ids.includes(id)) {
      removeClienteId(id);
    } else {
      addClienteId(id);
    }
  };

  const handleContinue = () => {
    navigate('/visita/foto-final');
  };

  const openCreateDialog = () => {
    setNovoNome(search.trim());
    setDialogOpen(true);
  };

  const handleCreateCliente = async () => {
    const nome = novoNome.trim();
    if (!nome) {
      toast.error('Informe o nome do cliente');
      return;
    }
    const exists = clientes?.find(c => c.nome.toLowerCase() === nome.toLowerCase());
    if (exists) {
      addClienteId(exists.id);
      toast.info('Cliente já cadastrado, selecionado automaticamente');
      setDialogOpen(false);
      setNovoNome('');
      setSearch('');
      return;
    }
    try {
      const novo = await createCliente.mutateAsync(nome);
      addClienteId(novo.id);
      toast.success('Cliente cadastrado e selecionado');
      setDialogOpen(false);
      setNovoNome('');
      setSearch('');
    } catch (e) {
      toast.error('Erro ao cadastrar cliente');
    }
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/demandas')} title="Clientes Atendidos">
      <ProgressStepper steps={VISIT_STEPS} currentStep={6} />
      
      <PageHeader
        icon={Users}
        title="Clientes Atendidos"
        description="Selecione todos os clientes visitados"
      />

      {/* Search + New */}
      <div className="px-4 pb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
        <Button
          variant="outline"
          onClick={openCreateDialog}
          className="w-full h-12 haptic-press"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Cadastrar novo cliente
        </Button>
      </div>

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {/* Selected clients chips */}
        {selectedClientes.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Selecionados ({selectedClientes.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedClientes.map((cliente) => (
                <SelectionChip
                  key={cliente.id}
                  selected
                  onRemove={() => toggleCliente(cliente.id)}
                >
                  {cliente.nome}
                </SelectionChip>
              ))}
            </div>
          </div>
        )}

        {/* Available clients list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : availableClientes.length === 0 && search ? (
          <div className="space-y-3">
            <EmptyState
              icon={Users}
              title="Nenhum cliente encontrado"
              description={`Nenhum resultado para "${search}"`}
            />
            <Button
              onClick={openCreateDialog}
              className="w-full h-12 haptic-press"
            >
              <Plus className="w-5 h-5 mr-2" />
              Cadastrar "{search.trim()}"
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {availableClientes.map((cliente) => (
              <SelectionCard
                key={cliente.id}
                onClick={() => toggleCliente(cliente.id)}
                showCheckbox
              >
                {cliente.nome}
              </SelectionCard>
            ))}
          </div>
        )}
      </div>

      <MobileFooter>
        <Button 
          onClick={handleContinue} 
          className="w-full h-14 text-lg haptic-press"
          disabled={data.cliente_ids.length === 0}
        >
          {data.cliente_ids.length === 0 ? (
            'Selecione ao menos 1 cliente'
          ) : (
            <>
              Continuar
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </MobileFooter>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar novo cliente</DialogTitle>
            <DialogDescription>
              O cliente será adicionado ao sistema e selecionado para esta visita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Nome do cliente"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              className="h-12 text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCliente();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createCliente.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCliente}
              disabled={createCliente.isPending || !novoNome.trim()}
            >
              {createCliente.isPending ? 'Salvando...' : 'Cadastrar e selecionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}
