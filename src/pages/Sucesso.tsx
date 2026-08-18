import { useLocation, useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { CheckCircle, ClipboardList, ExternalLink, Home, Plus, Send } from 'lucide-react';
import { useAtendimento } from '@/contexts/AtendimentoContext';

type SuccessState = {
  atendimentoId?: string;
  titulo?: string;
  modo?: string;
  hasRadarItems?: boolean;
  hasReport?: boolean;
};

export default function Sucesso() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, resetAtendimento } = useAtendimento();
  const state = (location.state ?? {}) as SuccessState;
  const atendimentoId = state.atendimentoId ?? data.sync_id;
  const hasRadarItems = state.hasRadarItems ?? data.demandas.some((demanda) => demanda.descricao.trim()) ?? false;
  const hasReport = state.hasReport ?? (data.modo === 'obras' || data.modo === 'ambiental');

  const handleNovaVisita = () => {
    resetAtendimento();
    navigate('/desktop/iniciar-visita');
  };

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-8 safe-bottom">
        {/* Success icon */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in-50 duration-500">
            <CheckCircle className="w-16 h-16 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Atendimento Salvo!
          </h1>
          <p className="text-muted-foreground">
            O registro foi salvo com sucesso e pode ser visualizado no histórico.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3">
          <Button 
            onClick={handleNovaVisita}
            className="w-full h-14 text-lg haptic-press"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Visita
          </Button>

          {hasReport && atendimentoId && (
            <Button
              variant="outline"
              onClick={() => navigate(`/relatorio/visita/${atendimentoId}`)}
              className="w-full h-12 haptic-press"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Ver relatório
            </Button>
          )}

          {hasRadarItems && (
            <Button
              variant="outline"
              onClick={() => navigate('/desktop/gestao')}
              className="w-full h-12 haptic-press"
            >
              <Send className="w-5 h-5 mr-2" />
              Revisar envio ao Radar
            </Button>
          )}

          <Button 
            variant="outline"
            onClick={() => navigate('/desktop/historico')}
            className="w-full h-12 haptic-press"
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            Ver histórico
          </Button>

          <Button 
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full h-12 haptic-press"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
