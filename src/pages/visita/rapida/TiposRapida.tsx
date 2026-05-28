import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS_RAPIDA } from '@/components/visita/ProgressStepper';
import { SelectionCard, PageHeader, EmptyState, CountBadge, MobileFooter } from '@/components/mobile';
import { useTiposAtendimentoConfig } from '@/hooks/useConfigEntities';
import { AtendimentoTipo } from '@/types/atendimento';
import { Check, ChevronRight, ClipboardList, Search, X, Loader2 } from 'lucide-react';

export default function TiposRapida() {
  useVisitRoute('/visita/rapida/tipos');
  const navigate = useNavigate();
  const { data, setTiposAtendimento } = useAtendimento();
  const { data: tipos, isLoading } = useTiposAtendimentoConfig();
  const [selectedTipos, setSelectedTipos] = useState<AtendimentoTipo[]>(data.tipos_atendimento);
  const [search, setSearch] = useState('');

  const toggleTipo = (tipo: AtendimentoTipo) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleContinue = () => {
    setTiposAtendimento(selectedTipos);
    navigate('/visita/rapida/clientes');
  };

  const q = search.trim().toLowerCase();
  const ativos = (tipos || []).filter((t: any) => t.ativo !== false);
  const availableTipos = ativos
    .filter((t: any) => !selectedTipos.includes(t.nome))
    .filter((t: any) =>
      !q || t.nome.toLowerCase().includes(q) || (t.descricao || '').toLowerCase().includes(q)
    );
  const formatTopicoSubtopico = (item: any) =>
    [item.topicos?.nome, item.subtopicos?.nome].filter(Boolean).join(' › ');

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/')} title="Visita Rápida">
      <ProgressStepper steps={VISIT_STEPS_RAPIDA} currentStep={0} />

      <PageHeader
        icon={ClipboardList}
        title="Tipos de Atendimento"
        description="Selecione o que foi realizado"
        badge={<CountBadge count={selectedTipos.length} />}
      />

      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tipo de atendimento..."
            className="pl-9 pr-9 h-11"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Limpar busca">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : availableTipos.length === 0 && selectedTipos.length > 0 ? (
          <EmptyState icon={Check} title="Todos os tipos selecionados" description="Você selecionou todas as opções disponíveis" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableTipos.map((tipoConfig: any) => (
              <SelectionCard
                key={tipoConfig.id}
                onClick={() => toggleTipo(tipoConfig.nome)}
                meta={formatTopicoSubtopico(tipoConfig)}
                description={tipoConfig.descricao || ''}
                showCheckbox
              >
                {tipoConfig.nome}
              </SelectionCard>
            ))}
          </div>
        )}
      </div>

      <MobileFooter>
        <Button
          onClick={handleContinue}
          className="w-full h-14 text-lg haptic-press"
          disabled={selectedTipos.length === 0}
        >
          {selectedTipos.length === 0 ? 'Selecione ao menos 1 tipo' : (
            <>Continuar <ChevronRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
