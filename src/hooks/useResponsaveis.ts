import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Responsavel } from '@/types/atendimento';

export function useResponsaveis() {
  return useQuery({
    queryKey: ['responsaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data as Responsavel[];
    },
  });
}
