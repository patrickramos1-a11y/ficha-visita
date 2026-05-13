import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { SelectionCard, PageHeader, EmptyState, CountBadge, MobileFooter } from '@/components/mobile';
import { TIPOS_ATENDIMENTO_CONFIG } from '@/types/tiposAtendimentoConfig';
import { AtendimentoTipo } from '@/types/atendimento';
import { Check, ChevronRight, ClipboardList } from 'lucide-react';

export default function TiposAtendimento() {
  useVisitRoute('/visita/tipos');
  const navigate = useNavigate();
  const { data, setTiposAtendimento } = useAtendimento();
  const [selectedTipos, setSelectedTipos] = useState<AtendimentoTipo[]>(data.tipos_atendimento);

  const toggleTipo = (tipo: AtendimentoTipo) => {
    setSelectedTipos(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const handleContinue = () => {
    setTiposAtendimento(selectedTipos);
    navigate('/visita/acoes');
  };

  const availableTipos = TIPOS_ATENDIMENTO_CONFIG.filter(t => 
    !selectedTipos.includes(t.nome as AtendimentoTipo)
  );

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/anotacoes')} title="Tipos de Atendimento">
      <ProgressStepper steps={VISIT_STEPS} currentStep={3} />
      
      <PageHeader
        icon={ClipboardList}
        title="Atividades Realizadas"
        description="Selecione os tipos de atendimento executados"
        badge={<CountBadge count={selectedTipos.length} />}
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {availableTipos.length === 0 && selectedTipos.length > 0 ? (
          <EmptyState
            icon={Check}
            title="Todos os tipos selecionados"
            description="Você selecionou todas as opções disponíveis"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {availableTipos.map((tipoConfig) => (
              <SelectionCard
                key={tipoConfig.nome}
                onClick={() => toggleTipo(tipoConfig.nome as AtendimentoTipo)}
                description={tipoConfig.descricao}
                showCheckbox
              >
                {tipoConfig.nome}
              </SelectionCard>
            ))}
          </div>
        )}
      </div>

      <MobileFooter>
        <Button onClick={handleContinue} className="w-full h-14 text-lg haptic-press">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
