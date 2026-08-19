import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EncerramentoVisita } from '@/components/visita/EncerramentoVisita';
import { getVisitStepsForMode, ProgressStepper } from '@/components/visita/ProgressStepper';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';

export default function ResumoAtendimento() {
  useVisitRoute('/visita/resumo');
  const navigate = useNavigate();
  const { data } = useAtendimento();
  const steps = getVisitStepsForMode(data.modo);

  const validateBeforeSave = () => {
    if (!data.cliente_ids.length) return 'Selecione ao menos um cliente';
    return null;
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate(data.modo === 'rapida' ? '/visita/rapida/radar' : '/visita/foto-final')} title="Finalizar visita">
      <ProgressStepper steps={steps} currentStep={steps.length - 1} />
      <div className="flex-1 overflow-auto p-4 pb-10">
        <EncerramentoVisita
          validateBeforeSave={validateBeforeSave}
          requireFinalPhoto
          summaryItems={[
            { label: 'Checklist', value: `${data.checklist.filter((item) => item.marcado).length}/${data.checklist.length} itens` },
          ]}
        />
      </div>
    </MobileLayout>
  );
}
