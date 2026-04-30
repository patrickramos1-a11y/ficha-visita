import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { DateTimeDisplay } from '@/components/visita/DateTimeDisplay';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { Play, History, PlayCircle } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { resetAtendimento, ativo, getRotaAtual } = useAtendimento();

  const handleStartVisit = () => {
    resetAtendimento();
    navigate('/visita/foto-inicial');
  };

  const handleContinueVisit = () => {
    const savedRoute = getRotaAtual();
    if (savedRoute) {
      navigate(savedRoute);
    } else {
      navigate('/visita/foto-inicial');
    }
  };

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-12 safe-bottom">
        <DateTimeDisplay />

        <div className="w-full max-w-xs space-y-4">
          {ativo && (
            <Button 
              onClick={handleContinueVisit}
              className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all haptic-press touch-target-lg bg-amber-600 hover:bg-amber-700"
            >
              <PlayCircle className="w-6 h-6 mr-3" />
              Continuar Visita
            </Button>
          )}

          <Button 
            onClick={handleStartVisit}
            className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all haptic-press touch-target-lg"
          >
            <Play className="w-6 h-6 mr-3" />
            {ativo ? 'Nova Visita' : 'Iniciar Visita'}
          </Button>

          <Button 
            variant="outline"
            onClick={() => navigate('/historico')}
            className="w-full h-12 haptic-press"
          >
            <History className="w-5 h-5 mr-2" />
            Ver Histórico
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Registre visitas técnicas e atendimentos de forma rápida e organizada
        </p>
      </div>
    </MobileLayout>
  );
}
