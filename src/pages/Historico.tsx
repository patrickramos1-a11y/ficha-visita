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
import { isConformityVisitMode } from '@/lib/conformityReport';
import { toast } from 'sonner';

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
          responsavel:responsaveis(nome)
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
            {atendimentos?.map((atendimento) => (
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
                <div className="font-medium">{atendimento.titulo || 'Atendimento'}</div>
                {atendimento.cliente && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{atendimento.cliente.nome}</span>
                  </div>
                )}
                {(atendimento.dados_modalidade as any)?.obra_nome && (
                  <div className="text-sm text-muted-foreground">
                    Obra: {(atendimento.dados_modalidade as any).obra_nome}
                  </div>
                )}

                {/* Responsavel */}
                {atendimento.responsavel && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {atendimento.responsavel.nome}
                  </div>
                )}

                {/* Types */}
                {atendimento.modo && atendimento.modo !== 'completa' && (
                  <span className="inline-flex w-fit px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">{atendimento.modo === 'obras' ? 'Acompanhamento de Obras' : atendimento.modo === 'ambiental' ? 'Acompanhamento Ambiental' : 'Visita Rápida'}</span>
                )}
                {atendimento.tipos_atendimento && atendimento.tipos_atendimento.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {atendimento.tipos_atendimento.slice(0, 3).map((tipo: string, i: number) => (
                      <span 
                        key={i}
                        className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                      >
                        {tipo}
                      </span>
                    ))}
                    {atendimento.tipos_atendimento.length > 3 && (
                      <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        +{atendimento.tipos_atendimento.length - 3}
                      </span>
                    )}
                  </div>
                )}
                {isConformityVisitMode(atendimento.modo) && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/relatorio/visita/${atendimento.id}`)}><FileText className="h-3.5 w-3.5" />Ver relatório</Button>
                    <Button variant="ghost" size="icon" onClick={() => copyReportLink(atendimento.id)} title="Copiar link"><Copy className="h-4 w-4" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
