import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { Play, History, ArrowLeft, Clock, PlayCircle } from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { StartVisitDialog } from '@/components/visita/StartVisitDialog';

export default function IniciarVisita() {
  const navigate = useNavigate();
  const { ativo, getRotaAtual } = useAtendimento();
  const isMobile = useIsMobile();
  const [now, setNow] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const formattedTime = format(now, 'HH:mm:ss');

  const handleStartVisit = () => setPickerOpen(true);

  const handleContinueVisit = () => {
    const savedRoute = getRotaAtual();
    if (savedRoute) {
      navigate(savedRoute);
    } else {
      navigate('/visita/foto-inicial');
    }
  };

  if (isMobile) {
    return (
      <DesktopLayout>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm text-center space-y-8">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm capitalize">{formattedDate}</span>
              </div>
              <p className="text-5xl font-bold text-foreground tracking-tight font-mono">
                {formattedTime}
              </p>
            </div>

            <div className="space-y-3">
              {ativo && (
                <Button 
                  onClick={handleContinueVisit}
                  size="lg"
                  variant="default"
                  className="w-full h-14 text-base font-semibold shadow-lg bg-amber-600 hover:bg-amber-700"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Continuar Visita em Andamento
                </Button>
              )}

              <Button 
                onClick={handleStartVisit}
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                {ativo ? 'Nova Visita (descartar atual)' : 'Iniciar Visita'}
              </Button>

              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/desktop/historico')}
                className="w-full h-12"
              >
                <History className="w-4 h-4 mr-2" />
                Ver Histórico
              </Button>
            </div>

            <p className="text-xs text-muted-foreground px-4">
              Registre visitas técnicas de forma rápida e organizada
            </p>
          </div>
        </div>
      </DesktopLayout>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/desktop')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <img src={logoHorizontal} alt="Ramos Engenharia" className="h-10 object-contain" />
          <div className="w-[160px]" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-lg capitalize">{formattedDate}</span>
            </div>
            <p className="text-7xl font-bold text-foreground tracking-tight font-mono">
              {formattedTime}
            </p>
          </div>

          <div className="space-y-4">
            {ativo && (
              <Button 
                onClick={handleContinueVisit} 
                size="lg" 
                className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all bg-amber-600 hover:bg-amber-700"
              >
                <PlayCircle className="w-6 h-6 mr-3" />
                Continuar Visita em Andamento
              </Button>
            )}

            <Button 
              onClick={handleStartVisit} 
              size="lg" 
              className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-6 h-6 mr-3" />
              {ativo ? 'Nova Visita (descartar atual)' : 'Iniciar Visita'}
            </Button>

            <Button variant="outline" size="lg" onClick={() => navigate('/desktop/historico')} className="w-full h-14">
              <History className="w-5 h-5 mr-2" />
              Ver Histórico
            </Button>
          </div>

          <p className="text-muted-foreground">
            Registre visitas técnicas e atendimentos de forma rápida e organizada
          </p>
        </div>
      </main>
    </div>
  );
}
