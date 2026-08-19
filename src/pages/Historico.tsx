import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EmptyState } from '@/components/mobile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Building2, FileText, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  buildEnvironmentalConformityReport,
  buildWorksConformityReport,
  isConformityVisitMode,
} from '@/lib/conformityReport';
import { toast } from 'sonner';

function getVisitClients(atendimento: any) {
  const related = (atendimento.atendimento_clientes ?? [])
    .map((row: any) => row.clientes?.nome || row.cliente?.nome)
    .filter(Boolean);
  return [...new Set([
    ...related,
    atendimento.cliente?.nome,
    atendimento.dados_modalidade?.cliente_nome,
  ].filter(Boolean))];
}

function getModeLabel(modo?: string | null) {
  if (modo === 'obras') return 'Obras';
  if (modo === 'ambiental') return 'Ambiental';
  if (modo === 'processos') return 'Processos';
  if (modo === 'rapida') return 'Rápida';
  return 'Atendimento';
}

function getModeBadgeClass(modo?: string | null) {
  if (modo === 'obras') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (modo === 'ambiental') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (modo === 'processos') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (modo === 'rapida') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-blue-200 bg-blue-50 text-blue-700';
}

function getDurationLabel(atendimento: any) {
  const startValue = atendimento.data_inicio ?? atendimento.created_at;
  const endValue = atendimento.data_fim;
  if (!startValue || !endValue) return null;

  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}min` : `${hours}h`;
}

function getConformityPercentage(atendimento: any) {
  if (!isConformityVisitMode(atendimento.modo) || !atendimento.dados_modalidade) return null;
  const summary = atendimento.modo === 'obras'
    ? buildWorksConformityReport(atendimento.dados_modalidade)
    : buildEnvironmentalConformityReport(atendimento.dados_modalidade);
  return summary.percentage;
}

export default function Historico() {
  const navigate = useNavigate();

  const copyReportLink = async (id: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/relatorio/visita/${id}`);
      toast.success('Link do relatório copiado');
    } catch {
      toast.error('Não foi possível copiar o link');
    }
  };

  const { data: atendimentos, isLoading } = useQuery({
    queryKey: ['atendimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          cliente:clientes(nome),
          responsavel:responsaveis(nome),
          atendimento_clientes(cliente_id, clientes(id, nome))
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <MobileLayout showBack onBack={() => navigate('/')} title="Histórico">
      <div className="flex-1 overflow-auto scroll-smooth-y p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : atendimentos?.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum atendimento registrado"
            description="Seus atendimentos aparecerão aqui"
          />
        ) : (
          <div className="space-y-3">
            {atendimentos?.map((atendimento) => {
              const clientNames = getVisitClients(atendimento);
              const conformity = getConformityPercentage(atendimento);
              const durationLabel = getDurationLabel(atendimento);
              return (
              <div
                key={atendimento.id}
                className={cn(
                  "p-4 bg-card rounded-xl border border-border space-y-3",
                  "transition-all hover:shadow-md"
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(atendimento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {atendimento.finalizado && (
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      Finalizado
                    </span>
                  )}
                </div>

                {/* Client */}
                <div className="font-medium">{atendimento.titulo || clientNames[0] || 'Atendimento'}</div>
                {clientNames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-emerald-700">{clientNames.join(', ')}</span>
                  </div>
                )}
                {(atendimento.dados_modalidade as any)?.obra_nome && (
                  <div className="text-sm text-muted-foreground">
                    Obra: {(atendimento.dados_modalidade as any).obra_nome}
                  </div>
                )}

                {/* Responsavel */}
                {atendimento.responsavel && (
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <User className="w-4 h-4" />
                    {atendimento.responsavel.nome}
                  </div>
                )}

                {/* Types */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`inline-flex w-fit px-2.5 py-1 text-xs rounded-full border ${getModeBadgeClass(atendimento.modo)}`}>{getModeLabel(atendimento.modo)}</span>
                  <span className="inline-flex w-fit px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">Tipos: {atendimento.tipos_atendimento?.length ?? 0}</span>
                  <span className="inline-flex w-fit px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">Ações: {atendimento.acoes_especificas?.length ?? 0}</span>
                  {durationLabel && (
                    <span className="inline-flex w-fit px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">Duração: {durationLabel}</span>
                  )}
                  {conformity !== null && (
                    <span className="inline-flex w-fit px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">Conformidade: {conformity}%</span>
                  )}
                </div>
                {isConformityVisitMode(atendimento.modo) && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/relatorio/visita/${atendimento.id}`)}><FileText className="h-3.5 w-3.5" />Ver relatório</Button>
                    <Button variant="ghost" size="icon" onClick={() => copyReportLink(atendimento.id)} title="Copiar link"><Copy className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
