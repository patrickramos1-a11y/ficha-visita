import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { SelectionCard, PageHeader, EmptyState } from '@/components/mobile';
import { User, Users } from 'lucide-react';

export default function SelecionarResponsavel() {
  useVisitRoute('/visita/responsavel');
  const navigate = useNavigate();
  const { setResponsavelId, data } = useAtendimento();
  const { data: responsaveis, isLoading } = useResponsaveis();

  const handleSelect = (id: string) => {
    setResponsavelId(id);
    navigate(data.modo === 'obras' ? '/visita/obras' : data.modo === 'ambiental' ? '/visita/ambiental' : data.modo === 'processos' ? '/visita/processos' : data.modo === 'rapida' ? '/visita/rapida/tipos' : '/visita/anotacoes');
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/foto-inicial')} title="Responsável Técnico">
      <ProgressStepper steps={VISIT_STEPS} currentStep={1} />
      
      <PageHeader
        icon={User}
        title="Responsável Técnico"
        description="Selecione quem está realizando o atendimento"
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : responsaveis?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum responsável cadastrado"
            description="Adicione responsáveis na área de gestão"
          />
        ) : (
          <div className="space-y-3">
            {responsaveis?.map((resp) => (
              <SelectionCard
                key={resp.id}
                onClick={() => handleSelect(resp.id)}
                showCheckbox={false}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-lg font-medium">{resp.nome}</span>
                </div>
              </SelectionCard>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
