import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DesktopLayout } from '@/components/layout/DesktopLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Calendar, User, Building2, FileText, Camera,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { GerarPDF } from '@/components/relatorio/GerarPDF';
import { BaixarProgramacaoButton } from '@/components/relatorio/BaixarProgramacaoButton';
import { TIPOS_ATENDIMENTO_CONFIG, ACOES_ESPECIFICAS_CONFIG } from '@/types/tiposAtendimentoConfig';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobilePageHeader } from '@/components/layout/MobilePageHeader';

export default function AtendimentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: atendimento, isLoading } = useQuery({
    queryKey: ['atendimento-detalhe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome)`)
        .eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: fotos } = useQuery({
    queryKey: ['atendimento-fotos', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('atendimento_fotos').select('*').eq('atendimento_id', id).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: demandas } = useQuery({
    queryKey: ['atendimento-demandas', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('demandas').select('*').eq('atendimento_id', id).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: atendimentoClientes } = useQuery({
    queryKey: ['atendimento-clientes', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('atendimento_clientes').select('cliente:clientes(id, nome)').eq('atendimento_id', id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <DesktopLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      </DesktopLayout>
    );
  }

  if (!atendimento) {
    return (
      <DesktopLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold">Não encontrado</h2>
          <Button variant="outline" onClick={() => navigate('/desktop/historico')} className="mt-4">Voltar</Button>
        </div>
      </DesktopLayout>
    );
  }

  const clientesNomes = atendimentoClientes?.map(ac => ac.cliente?.nome).filter(Boolean) as string[] || [];

  const pdfData = {
    data_inicio: new Date(atendimento.created_at),
    data_fim: atendimento.data_fim ? new Date(atendimento.data_fim) : undefined,
    responsavel_id: atendimento.responsavel_id || undefined,
    tipos_atendimento: atendimento.tipos_atendimento || [],
    acoes_especificas: atendimento.acoes_especificas || [],
    anotacoes: atendimento.anotacoes || '',
    checklist: [],
    demandas: demandas?.map(d => ({ descricao: d.descricao, plano: d.plano as 'VIP' | 'Premium' | 'Master', personalizada: d.personalizada })) || [],
    fotos: fotos?.map(f => ({ url: f.foto_url, tipo: f.tipo as 'inicial' | 'durante' | 'final' })) || [],
    cliente_ids: atendimentoClientes?.map(ac => ac.cliente?.id).filter(Boolean) as string[] || [],
    topicos_reuniao: [],
    possui_foto_final: atendimento.possui_foto_final || false,
    selectedClientes: atendimentoClientes?.map(ac => ac.cliente?.id).filter(Boolean) as string[] || [],
  };

  return (
    <DesktopLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        {isMobile ? (
          <MobilePageHeader 
            title="Detalhes" 
            backTo="/desktop/historico"
            rightAction={
              <div className="flex items-center gap-2">
                {atendimento.finalizado 
                  ? <Badge className="bg-primary/10 text-primary text-[10px] h-5"><CheckCircle2 className="h-3 w-3 mr-0.5" />Ok</Badge>
                  : <Badge variant="outline" className="text-[10px] h-5">Pendente</Badge>
                }
              </div>
            }
          />
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/desktop/historico')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Detalhes do Atendimento</h1>
                <p className="text-muted-foreground">
                  {format(new Date(atendimento.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {atendimento.finalizado 
                ? <Badge className="bg-primary/10 text-primary"><CheckCircle2 className="h-3 w-3 mr-1" />Finalizado</Badge>
                : <Badge variant="outline">Pendente</Badge>
              }
              <GerarPDF data={pdfData} responsavelNome={atendimento.responsavel?.nome} clientesNomes={clientesNomes} />
            </div>
          </div>
        )}

        {/* Date on mobile */}
        {isMobile && (
          <p className="text-xs text-muted-foreground -mt-2">
            {format(new Date(atendimento.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <User className="h-3 w-3" /> Responsável
              </p>
              <p className="text-sm font-semibold truncate">{atendimento.responsavel?.nome || '—'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 md:p-4">
              <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" /> Período
              </p>
              <p className="text-sm font-semibold">
                {format(new Date(atendimento.created_at), 'HH:mm')}
                {atendimento.data_fim && <> — {format(new Date(atendimento.data_fim), 'HH:mm')}</>}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Clientes */}
        {clientesNomes.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Clientes ({clientesNomes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="flex flex-wrap gap-1.5">
                {clientesNomes.map((nome, i) => <Badge key={i} variant="secondary" className="text-xs">{nome}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tipos */}
        {atendimento.tipos_atendimento?.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Tipos ({atendimento.tipos_atendimento.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6 space-y-2">
              {atendimento.tipos_atendimento.map((tipo: string, i: number) => {
                const config = TIPOS_ATENDIMENTO_CONFIG.find(t => t.nome === tipo);
                return (
                  <div key={i} className="flex items-start justify-between gap-2 p-2.5 bg-muted/50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{tipo}</p>
                      {config?.descricao && !isMobile && <p className="text-xs text-muted-foreground mt-0.5">{config.descricao}</p>}
                    </div>
                    {config?.plano && <Badge variant="outline" className="text-[10px] shrink-0">{config.plano}</Badge>}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Ações */}
        {atendimento.acoes_especificas?.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm">Ações Específicas ({atendimento.acoes_especificas.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="flex flex-wrap gap-1.5">
                {atendimento.acoes_especificas.map((acao: string, i: number) => {
                  const config = ACOES_ESPECIFICAS_CONFIG.find(a => a.nome === acao);
                  return (
                    <div key={i} className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                      <span>{acao}</span>
                      {config?.plano && <Badge variant="outline" className="text-[9px] h-4 px-1">{config.plano}</Badge>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demandas */}
        {demandas && demandas.length > 0 && (
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm">Demandas ({demandas.length})</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6 space-y-2">
              {demandas.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg gap-2">
                  <span className="text-sm truncate">{d.descricao}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{d.plano}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Anotações */}
        {atendimento.anotacoes && (
          <Card>
            <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
              <CardTitle className="text-sm">Anotações</CardTitle>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{atendimento.anotacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        <Card>
          <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4" /> Fotos ({fotos?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
            {fotos && fotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {fotos.map((foto) => (
                  <div key={foto.id} className="relative group">
                    <img src={foto.foto_url} alt={`Foto ${foto.tipo}`} className="w-full aspect-square object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Badge className="capitalize text-xs">{foto.tipo}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma foto</p>
            )}
          </CardContent>
        </Card>

        {/* PDF on mobile */}
        {isMobile && (
          <div className="pb-2">
            <GerarPDF data={pdfData} responsavelNome={atendimento.responsavel?.nome} clientesNomes={clientesNomes} />
          </div>
        )}
      </div>
    </DesktopLayout>
  );
}
