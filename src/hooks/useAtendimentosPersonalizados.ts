import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type PersonalizadoCadastro = {
  id: string;
  cliente_id: string;
  nome: string;
  descricao?: string | null;
  status: string;
  frequencia?: string | null;
  responsavel_padrao_id?: string | null;
  observacoes?: string | null;
  cliente?: { id: string; nome: string } | null;
  responsavel?: { id: string; nome: string } | null;
};

export function useAtendimentosPersonalizados(clienteId?: string) {
  return useQuery({
    queryKey: ['atendimentos-personalizados', clienteId ?? 'all'],
    queryFn: async () => {
      let query = (supabase as any)
        .from('atendimentos_personalizados')
        .select('*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome)')
        .order('nome');
      if (clienteId) query = query.eq('cliente_id', clienteId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PersonalizadoCadastro[];
    },
    retry: 1,
  });
}

export function useAtendimentoPersonalizadoDetalhe(id?: string | null) {
  return useQuery({
    queryKey: ['atendimento-personalizado-detalhe', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const db = supabase as any;
      const [base, tipos, acoes, modulos, itens] = await Promise.all([
        db.from('atendimentos_personalizados').select('*, cliente:clientes(id, nome), responsavel:responsaveis(id, nome)').eq('id', id).single(),
        db.from('atendimento_personalizado_tipos').select('*').eq('atendimento_personalizado_id', id).order('ordem'),
        db.from('atendimento_personalizado_acoes').select('*').eq('atendimento_personalizado_id', id).order('ordem'),
        db.from('atendimento_personalizado_modulos').select('*').eq('atendimento_personalizado_id', id).order('ordem'),
        db.from('atendimento_personalizado_itens').select('*').order('ordem'),
      ]);
      if (base.error) throw base.error;
      if (tipos.error) throw tipos.error;
      if (acoes.error) throw acoes.error;
      if (modulos.error) throw modulos.error;
      if (itens.error) throw itens.error;

      const moduleIds = new Set((modulos.data ?? []).map((module: any) => module.id));
      const itensByModule = (itens.data ?? [])
        .filter((item: any) => moduleIds.has(item.modulo_id))
        .reduce((acc: Record<string, any[]>, item: any) => {
          acc[item.modulo_id] = [...(acc[item.modulo_id] ?? []), item];
          return acc;
        }, {});

      return {
        ...(base.data as Record<string, any>),
        tipos: tipos.data ?? [],
        acoes: acoes.data ?? [],
        modulos: (modulos.data ?? []).map((module: any) => ({ ...module, itens: itensByModule[module.id] ?? [] })),
      } as Record<string, any>;
    },
    retry: 1,
  });
}

export function useUpsertAtendimentoPersonalizado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id?: string;
      cliente_id: string;
      nome: string;
      descricao?: string | null;
      status?: string;
      frequencia?: string | null;
      responsavel_padrao_id?: string | null;
      observacoes?: string | null;
    }) => {
      const row = {
        cliente_id: payload.cliente_id,
        nome: payload.nome,
        descricao: payload.descricao || null,
        status: payload.status || 'ativo',
        frequencia: payload.frequencia || null,
        responsavel_padrao_id: payload.responsavel_padrao_id || null,
        observacoes: payload.observacoes || null,
        atualizado_em: new Date().toISOString(),
      };
      if (payload.id) {
        const { error } = await (supabase as any).from('atendimentos_personalizados').update(row).eq('id', payload.id);
        if (error) throw error;
        return payload.id;
      }
      const { data, error } = await (supabase as any).from('atendimentos_personalizados').insert(row).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['atendimentos-personalizados'] });
      qc.invalidateQueries({ queryKey: ['desktop-clientes'] });
    },
  });
}

export function useUpsertPersonalizadoChild(table: 'atendimento_personalizado_tipos' | 'atendimento_personalizado_acoes' | 'atendimento_personalizado_modulos' | 'atendimento_personalizado_itens') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { id, ...rest } = payload;
      if (id) {
        const { error } = await (supabase as any).from(table).update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await (supabase as any).from(table).insert(rest).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atendimento-personalizado-detalhe'] }),
  });
}

export function useDeletePersonalizadoChild(table: 'atendimento_personalizado_tipos' | 'atendimento_personalizado_acoes' | 'atendimento_personalizado_modulos' | 'atendimento_personalizado_itens') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['atendimento-personalizado-detalhe'] }),
  });
}
