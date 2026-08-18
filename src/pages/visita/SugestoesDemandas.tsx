import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { PageHeader, EmptyState, MobileFooter } from '@/components/mobile';
import { Plus, Trash2, ChevronRight, Lightbulb } from 'lucide-react';

export default function SugestoesDemandas() {
  useVisitRoute('/visita/demandas');
  const navigate = useNavigate();
  const { data, gerarSugestoesDemandas, addDemanda, updateDemanda, removeDemanda } = useAtendimento();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && data.demandas.length === 0) {
      const sugestoes = gerarSugestoesDemandas();
      sugestoes.forEach(s => addDemanda(s));
      setInitialized(true);
    } else if (!initialized) {
      setInitialized(true);
    }
  }, [initialized]);

  const handleAddPersonalizada = () => {
    addDemanda({
      descricao: '',
      personalizada: true,
    });
  };

  const handleUpdate = (index: number, patch: Partial<typeof data.demandas[number]>) => {
    updateDemanda(index, { ...data.demandas[index], ...patch });
  };

  const handleContinue = () => {
    navigate('/visita/clientes');
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/acoes')} title="Demandas">
      <ProgressStepper steps={VISIT_STEPS} currentStep={5} />
      
      <PageHeader
        icon={Lightbulb}
        title="Demandas para Radar Vital"
        description="Itens levantados na visita para revisar e enviar ao Radar"
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4 space-y-4">
        {data.demandas.map((demanda, index) => (
          <div
            key={index}
            className="p-4 bg-card rounded-xl border border-border space-y-3 animate-in fade-in-0 slide-in-from-bottom-2"
          >
            {/* Demand classification is intentionally limited to its operational status. */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Select
                  value={demanda.status || 'EM_EXECUCAO'}
                  onValueChange={(value) => handleUpdate(index, { status: value as 'EM_EXECUCAO' | 'CONCLUIDA' | 'NAO_FEITO' })}
                >
                  <SelectTrigger className="w-[140px] h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EM_EXECUCAO">Em execução</SelectItem>
                    <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                    <SelectItem value="NAO_FEITO">Não feito</SelectItem>
                  </SelectContent>
                </Select>
                {demanda.personalizada && (
                  <span className="text-xs text-muted-foreground">Personalizada</span>
                )}
              </div>
              <button
                onClick={() => removeDemanda(index)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 touch-safe"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Descrição editável */}
            <Textarea
              placeholder="Descreva a demanda em execução..."
              value={demanda.descricao}
              onChange={(e) => handleUpdate(index, { descricao: e.target.value })}
              className="min-h-[100px] text-base resize-none"
            />
          </div>
        ))}

        {/* Add button */}
        <Button
          variant="outline"
          onClick={handleAddPersonalizada}
          className="w-full h-14 border-dashed haptic-press"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Demanda Personalizada
        </Button>

        {data.demandas.length === 0 && (
          <EmptyState
            icon={Lightbulb}
            title="Nenhuma sugestão gerada"
            description="Adicione demandas personalizadas ou volte para preencher o checklist"
          />
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
