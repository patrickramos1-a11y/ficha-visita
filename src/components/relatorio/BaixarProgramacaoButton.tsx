import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { baixarProgramacaoXlsx, type DemandaCatalogoLookup } from '@/lib/programacaoExport';
import type { AtendimentoData } from '@/types/atendimento';

interface Props {
  atendimento: Pick<AtendimentoData, 'data_inicio' | 'demandas' | 'tipos_atendimento' | 'acoes_especificas'>;
  clienteNomes: string[];
  responsavelNome?: string;
  acoesEspecificas?: string[];
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  fullWidth?: boolean;
}

export function BaixarProgramacaoButton({
  atendimento,
  clienteNomes,
  responsavelNome,
  acoesEspecificas,
  variant = 'outline',
  className,
  size = 'default',
  fullWidth,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!atendimento.demandas || atendimento.demandas.length === 0) {
      toast.error('Não há demandas para exportar');
      return;
    }
    setLoading(true);
    try {
      // Buscar catálogo online se possível para resolver Tópico/Subtópico
      let catalogo: DemandaCatalogoLookup[] = [];
      if (navigator.onLine) {
        const { data } = await supabase
          .from('demandas_especificas')
          .select('nome_curto, descricao_detalhada, topicos(nome), subtopicos(nome)');
        catalogo = (data as any) || [];
      }
      await baixarProgramacaoXlsx({
        atendimento,
        clienteNomes,
        responsavelNome,
        acoesEspecificas,
        catalogo,
      });
      toast.success('Planilha gerada');
    } catch (err) {
      console.error('Erro ao gerar programação:', err);
      toast.error('Erro ao gerar planilha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className || ''}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 mr-2" />
      )}
      Baixar Programação (.xlsx)
    </Button>
  );
}
