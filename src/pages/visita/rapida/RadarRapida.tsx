import { useNavigate } from 'react-router-dom';
import { ChevronRight, Send } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { PageHeader, MobileFooter } from '@/components/mobile';
import { ProgressStepper, VISIT_STEPS_RAPIDA } from '@/components/visita/ProgressStepper';
import { RadarVisita } from '@/components/visita/RadarVisita';
import { useVisitRoute } from '@/hooks/useVisitRoute';

export default function RadarRapida() {
  useVisitRoute('/visita/rapida/radar');
  const navigate = useNavigate();

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/rapida/clientes')} title="Radar Vital">
      <ProgressStepper steps={VISIT_STEPS_RAPIDA} currentStep={4} />

      <PageHeader
        icon={Send}
        title="Radar Vital"
        description="Registre demandas e comentários que poderão ser enviados ao Radar."
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        <RadarVisita />
      </div>

      <MobileFooter>
        <Button onClick={() => navigate('/visita/resumo')} className="w-full h-14 text-lg haptic-press">
          Continuar
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
