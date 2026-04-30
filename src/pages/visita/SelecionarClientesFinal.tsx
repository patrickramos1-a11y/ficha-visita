import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useClientes } from '@/hooks/useClientes';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { SelectionCard, SelectionChip, PageHeader, EmptyState, MobileFooter } from '@/components/mobile';
import { Search, ChevronRight, Users } from 'lucide-react';

export default function SelecionarClientesFinal() {
  useVisitRoute('/visita/clientes');
  const navigate = useNavigate();
  const { data, addClienteId, removeClienteId } = useAtendimento();
  const { data: clientes, isLoading } = useClientes();
  const [search, setSearch] = useState('');

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

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/demandas')} title="Clientes Atendidos">
      <ProgressStepper steps={VISIT_STEPS} currentStep={6} />
      
      <PageHeader
        icon={Users}
        title="Clientes Atendidos"
        description="Selecione todos os clientes visitados"
      />

      {/* Search */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
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
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description={`Nenhum resultado para "${search}"`}
          />
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
    </MobileLayout>
  );
}
