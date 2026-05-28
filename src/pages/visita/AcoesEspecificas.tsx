import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { SelectionChip, PageHeader, EmptyState, CountBadge, MobileFooter } from '@/components/mobile';
import { useAcoesEspecificasConfig } from '@/hooks/useConfigEntities';
import { Check, ChevronRight, Wrench, Loader2 } from 'lucide-react';

export default function AcoesEspecificas() {
  useVisitRoute('/visita/acoes');
  const navigate = useNavigate();
  const { data, setAcoesEspecificas } = useAtendimento();
  const { data: acoes, isLoading } = useAcoesEspecificasConfig();
  const [selectedAcoes, setSelectedAcoes] = useState<string[]>(data.acoes_especificas);

  const toggleAcao = (acao: string) => {
    setSelectedAcoes(prev =>
      prev.includes(acao) ? prev.filter(a => a !== acao) : [...prev, acao]
    );
  };

  const handleContinue = () => {
    setAcoesEspecificas(selectedAcoes);
    navigate('/visita/demandas');
  };

  const ativas = (acoes || []).filter((a: any) => a.ativo !== false);
  const availableAcoes = ativas.filter((a: any) => !selectedAcoes.includes(a.nome));
  const acoesPorNome = new Map(ativas.map((a: any) => [a.nome, a]));
  const formatTopicoSubtopico = (item: any) =>
    [item?.topicos?.nome, item?.subtopicos?.nome].filter(Boolean).join(' › ');

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/tipos')} title="Ações Específicas">
      <ProgressStepper steps={VISIT_STEPS} currentStep={4} />

      <PageHeader
        icon={Wrench}
        title="Ações Executadas"
        description="Selecione as ações específicas realizadas durante a visita"
        badge={<CountBadge count={selectedAcoes.length} />}
      />

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4">
        {selectedAcoes.length > 0 && (
          <div className="mb-4 pb-4 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Selecionadas</p>
            <div className="flex flex-wrap gap-2">
              {selectedAcoes.map((acao) => (
                <SelectionChip key={acao} selected onRemove={() => toggleAcao(acao)} meta={formatTopicoSubtopico(acoesPorNome.get(acao))}>{acao}</SelectionChip>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : availableAcoes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableAcoes.map((acao: any) => (
              <SelectionChip key={acao.id} onClick={() => toggleAcao(acao.nome)} meta={formatTopicoSubtopico(acao)}>{acao.nome}</SelectionChip>
            ))}
          </div>
        ) : selectedAcoes.length > 0 ? (
          <EmptyState icon={Check} title="Todas as ações selecionadas" />
        ) : null}
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
