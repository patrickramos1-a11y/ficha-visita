import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { EmptyState } from '@/components/mobile';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User, Building2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Historico() {
  const navigate = useNavigate();

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
                {atendimento.cliente && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{atendimento.cliente.nome}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
