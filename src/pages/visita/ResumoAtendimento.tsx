import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { useClientes } from '@/hooks/useClientes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import { TIPOS_ATENDIMENTO_CONFIG, ACOES_ESPECIFICAS_CONFIG } from '@/types/tiposAtendimentoConfig';
import { PlanoTipo } from '@/types/atendimento';
import { GerarPDF } from '@/components/relatorio/GerarPDF';
import { MobileFooter } from '@/components/mobile';
import { 
  Save, FileText, Users, User, Clock, Camera, CheckSquare, 
  Lightbulb, Tag, ChevronDown, ChevronUp 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ResumoAtendimento() {
  useVisitRoute('/visita/resumo');
  const navigate = useNavigate();
  const { data, resetAtendimento, finalizarAtendimento } = useAtendimento();
  const { data: clientes } = useClientes();
  const { data: responsaveis } = useResponsaveis();
  const saveAtendimento = useSaveAtendimento();
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['resumo']);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const selectedClientes = clientes?.filter(c => data.cliente_ids.includes(c.id)) || [];
  const responsavel = responsaveis?.find(r => r.id === data.responsavel_id);
  
  // Contagem por plano
  const contadorPlanos: Record<PlanoTipo, number> = { VIP: 0, Premium: 0, Master: 0, Integracao: 0 };
  
  data.tipos_atendimento.forEach(tipo => {
    const config = TIPOS_ATENDIMENTO_CONFIG.find(t => t.nome === tipo);
    if (config) contadorPlanos[config.plano]++;
  });
  
  data.acoes_especificas.forEach(acao => {
    const config = ACOES_ESPECIFICAS_CONFIG.find(a => a.nome === acao);
    if (config) contadorPlanos[config.plano]++;
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const finalData = { ...data, data_fim: new Date() };
      finalizarAtendimento();
      await saveAtendimento.mutateAsync(finalData);
      resetAtendimento();
      navigate('/sucesso');
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const SectionHeader = ({ title, icon: Icon, section, count }: { 
    title: string; 
    icon: React.ElementType; 
    section: string;
    count?: number;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors touch-safe haptic-press"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <span className="font-medium">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {expandedSections.includes(section) ? (
        <ChevronUp className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate(data.modo === 'rapida' ? '/visita/rapida/fotos' : '/visita/foto-final')} title="Resumo">
      <div className="flex-1 overflow-auto scroll-smooth-y p-4 space-y-3">
        {/* Header info */}
        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium">Título: </span>
              <span>{data.titulo || 'Não definido'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium">Início: </span>
              <span>{format(data.data_inicio, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium">Responsável: </span>
              <span>{responsavel?.nome || 'Não definido'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Camera className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-medium">Registro fotográfico: </span>
              <span className={cn(
                "font-medium",
                data.possui_foto_final ? 'text-primary' : 'text-muted-foreground'
              )}>
                {data.possui_foto_final ? 'SIM' : 'NÃO'}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo por plano */}
        <div className="p-4 bg-card rounded-xl border border-border">
          <h3 className="font-medium mb-3">Resumo por Plano</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-amber-500/10 rounded-xl">
              <span className="text-xl font-bold text-amber-700">{contadorPlanos.VIP}</span>
              <p className="text-xs text-amber-700 mt-1">VIP</p>
            </div>
            <div className="text-center p-3 bg-blue-500/10 rounded-xl">
              <span className="text-xl font-bold text-blue-700">{contadorPlanos.Premium}</span>
              <p className="text-xs text-blue-700 mt-1">Premium</p>
            </div>
            <div className="text-center p-3 bg-purple-500/10 rounded-xl">
              <span className="text-xl font-bold text-purple-700">{contadorPlanos.Master}</span>
              <p className="text-xs text-purple-700 mt-1">Master</p>
            </div>
          </div>
        </div>

        {/* Clientes */}
        <SectionHeader title="Clientes Atendidos" icon={Users} section="clientes" count={selectedClientes.length} />
        {expandedSections.includes('clientes') && (
          <div className="pl-4 space-y-1">
            {selectedClientes.map(c => (
              <p key={c.id} className="text-sm py-2 px-3 bg-muted/50 rounded-lg">• {c.nome}</p>
            ))}
          </div>
        )}

        {/* Tipos de Atendimento */}
        <SectionHeader title="Tipos de Atendimento" icon={Tag} section="tipos" count={data.tipos_atendimento.length} />
        {expandedSections.includes('tipos') && (
          <div className="pl-4 space-y-2">
            {data.tipos_atendimento.map(tipo => {
              const config = TIPOS_ATENDIMENTO_CONFIG.find(t => t.nome === tipo);
              return (
                <div key={tipo} className="p-3 bg-muted/50 rounded-lg">
                  <p className="font-medium text-sm">{tipo}</p>
                  <p className="text-muted-foreground text-xs mt-1">{config?.descricao}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Ações Específicas */}
        {data.acoes_especificas.length > 0 && (
          <>
            <SectionHeader title="Ações Específicas" icon={CheckSquare} section="acoes" count={data.acoes_especificas.length} />
            {expandedSections.includes('acoes') && (
              <div className="pl-4 flex flex-wrap gap-2">
                {data.acoes_especificas.map(acao => (
                  <span key={acao} className="text-sm py-2 px-3 bg-muted/50 rounded-full">{acao}</span>
                ))}
              </div>
            )}
          </>
        )}

        {/* Demandas */}
        {data.demandas.length > 0 && (
          <>
            <SectionHeader title="Demandas em Execução" icon={Lightbulb} section="demandas" count={data.demandas.length} />
            {expandedSections.includes('demandas') && (
              <div className="pl-4 space-y-2">
                {data.demandas.filter(d => d.descricao.trim()).map((d, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{d.descricao}</p>
                    <span className="text-xs text-primary font-medium mt-1 inline-block">{d.plano}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Anotações */}
        {data.anotacoes && (
          <>
            <SectionHeader title="Anotações" icon={FileText} section="anotacoes" />
            {expandedSections.includes('anotacoes') && (
              <div className="pl-4">
                <p className="text-sm whitespace-pre-wrap p-3 bg-muted/50 rounded-lg">{data.anotacoes}</p>
              </div>
            )}
          </>
        )}

        {/* Fotos */}
        <SectionHeader title="Fotos" icon={Camera} section="fotos" count={data.fotos.length} />
        {expandedSections.includes('fotos') && (
          <div className="grid grid-cols-3 gap-2 pl-4">
            {data.fotos.map((foto, i) => (
              <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted">
                <img src={foto.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <MobileFooter className="space-y-3">
        <GerarPDF 
          data={data} 
          responsavelNome={responsavel?.nome}
          clientesNomes={selectedClientes.map(c => c.nome)}
        />
        <Button 
          onClick={handleSave} 
          className="w-full h-14 text-lg haptic-press"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Atendimento
            </>
          )}
        </Button>
      </MobileFooter>
    </MobileLayout>
  );
}
