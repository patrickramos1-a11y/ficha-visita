import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Send } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { PageHeader, MobileFooter } from '@/components/mobile';
import { ProgressStepper, getVisitStepsForMode } from '@/components/visita/ProgressStepper';
import { RadarVisita } from '@/components/visita/RadarVisita';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';

export default function SugestoesDemandas() {
  useVisitRoute('/visita/demandas');
  const navigate = useNavigate();
  const { data, gerarSugestoesDemandas, addDemanda } = useAtendimento();
  const [initialized, setInitialized] = useState(false);
  const steps = getVisitStepsForMode(data.modo);

  useEffect(() => {
    if (!initialized && data.demandas.length === 0) {
      gerarSugestoesDemandas().forEach((sugestao) => addDemanda(sugestao));
      setInitialized(true);
    } else if (!initialized) {
      setInitialized(true);
    }
  }, [addDemanda, data.demandas.length, gerarSugestoesDemandas, initialized]);

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/acoes')} title="Radar Vital">
      <ProgressStepper steps={steps} currentStep={data.modo === 'personalizado' ? 5 : 4} />

      <PageHeader
        icon={Send}
        title="Radar Vital"
        description="Registre demandas e comentários que poderão ser enviados ao Radar."
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        <RadarVisita />
      </div>

      <MobileFooter>
        <Button onClick={() => navigate(data.modo === 'personalizado' ? '/visita/foto-final' : '/visita/clientes')} className="w-full h-14 text-lg haptic-press">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
