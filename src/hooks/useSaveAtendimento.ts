import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AtendimentoData } from '@/types/atendimento';
import { toast } from 'sonner';
import { getPlanoFromTipo, getPlanoFromAcao } from '@/types/tiposAtendimentoConfig';

export function useSaveAtendimento() {
  return useMutation({
    mutationFn: async (data: AtendimentoData) => {
      // Create the atendimento record
      const { data: atendimento, error: atendimentoError } = await supabase
        .from('atendimentos')
        .insert({
          responsavel_id: data.responsavel_id || null,
          data_inicio: data.data_inicio.toISOString(),
          data_fim: data.data_fim?.toISOString() || new Date().toISOString(),
          anotacoes: data.anotacoes || null,
          checklist: JSON.parse(JSON.stringify(data.checklist)),
          tipos_atendimento: data.tipos_atendimento,
          acoes_especificas: data.acoes_especificas,
          topicos_reuniao: JSON.parse(JSON.stringify(data.topicos_reuniao)),
          possui_foto_final: data.possui_foto_final,
          finalizado: true,
        })
        .select()
        .single();

      if (atendimentoError) throw atendimentoError;

      // Save client associations (many-to-many)
      if (data.cliente_ids.length > 0) {
        const clienteInserts = data.cliente_ids.map(cliente_id => ({
          atendimento_id: atendimento.id,
          cliente_id,
        }));
        
        const { error: clientesError } = await supabase
          .from('atendimento_clientes')
          .insert(clienteInserts);
        
        if (clientesError) console.error('Error saving client associations:', clientesError);
      }

      // Upload photos
      for (const foto of data.fotos) {
        if (!foto.url.startsWith('http')) {
          const fileName = `${atendimento.id}/${foto.tipo}_${Date.now()}.jpg`;
          const base64Data = foto.url.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });

          await supabase.storage.from('atendimento-fotos').upload(fileName, blob);
          const { data: publicUrl } = supabase.storage.from('atendimento-fotos').getPublicUrl(fileName);

          await supabase.from('atendimento_fotos').insert({
            atendimento_id: atendimento.id,
            foto_url: publicUrl.publicUrl,
            tipo: foto.tipo,
          });
        }
      }

      // Save demandas with auto-assigned planos
      if (data.demandas.length > 0) {
        await supabase.from('demandas').insert(
          data.demandas.filter(d => d.descricao.trim()).map(d => ({
            atendimento_id: atendimento.id,
            tipo_atendimento: d.tipo_atendimento || null,
            descricao: d.descricao,
            plano: d.plano || (d.tipo_atendimento ? getPlanoFromTipo(d.tipo_atendimento) : 'VIP'),
            personalizada: d.personalizada,
          }))
        );
      }

      return atendimento;
    },
    onSuccess: () => toast.success('Atendimento salvo com sucesso!'),
    onError: (err) => {
      console.error('Error saving atendimento:', err);
      toast.error('Erro ao salvar atendimento');
    },
  });
}
