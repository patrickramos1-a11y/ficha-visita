import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/types/atendimento';

export function useClientes() {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as Cliente[];
    },
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ nome })
        .select()
        .single();
      
      if (error) throw error;
      return data as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}
