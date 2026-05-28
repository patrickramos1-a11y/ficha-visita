import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { setTiposCache, setAcoesCache } from '@/lib/tiposAcoesCache';
import type { PlanoTipo } from '@/types/atendimento';

// ── Planos ──
export function usePlanos() {
  return useQuery({
    queryKey: ['planos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planos')
        .select('*')
        .order('nome');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertPlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plano: { id?: string; nome: string; cor: string; ativo?: boolean }) => {
      if (plano.id) {
        const { error } = await supabase.from('planos').update({ nome: plano.nome, cor: plano.cor, ativo: plano.ativo ?? true }).eq('id', plano.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('planos').insert({ nome: plano.nome, cor: plano.cor });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planos'] }),
  });
}

export function useDeletePlano() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planos'] }),
  });
}

// ── Tópicos ──
export function useTopicos() {
  return useQuery({
    queryKey: ['topicos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('topicos').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertTopico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { id?: string; nome: string; ativo?: boolean }) => {
      if (t.id) {
        const { error } = await supabase.from('topicos').update({ nome: t.nome, ativo: t.ativo ?? true }).eq('id', t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('topicos').insert({ nome: t.nome });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topicos'] }),
  });
}

export function useDeleteTopico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('topicos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['topicos'] }),
  });
}

// ── Subtópicos ──
export function useSubtopicos(topicoId?: string) {
  return useQuery({
    queryKey: ['subtopicos', topicoId],
    queryFn: async () => {
      let q = supabase.from('subtopicos').select('*, topicos(nome)').order('nome');
      if (topicoId) q = q.eq('topico_id', topicoId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSubtopico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string; nome: string; topico_id: string; ativo?: boolean }) => {
      if (s.id) {
        const { error } = await supabase.from('subtopicos').update({ nome: s.nome, topico_id: s.topico_id, ativo: s.ativo ?? true }).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('subtopicos').insert({ nome: s.nome, topico_id: s.topico_id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subtopicos'] }),
  });
}

export function useDeleteSubtopico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subtopicos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subtopicos'] }),
  });
}

// ── Origens ──
export function useOrigens() {
  return useQuery({
    queryKey: ['origens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('origens').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertOrigem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (o: { id?: string; nome: string; ativo?: boolean }) => {
      if (o.id) {
        const { error } = await supabase.from('origens').update({ nome: o.nome, ativo: o.ativo ?? true }).eq('id', o.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('origens').insert({ nome: o.nome });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['origens'] }),
  });
}

export function useDeleteOrigem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('origens').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['origens'] }),
  });
}

// ── Status Config ──
export function useStatusConfig() {
  return useQuery({
    queryKey: ['status_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('status_config').select('*').order('nome');
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertStatusConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string; nome: string; ativo?: boolean }) => {
      if (s.id) {
        const { error } = await supabase.from('status_config').update({ nome: s.nome, ativo: s.ativo ?? true }).eq('id', s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('status_config').insert({ nome: s.nome });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status_config'] }),
  });
}

export function useDeleteStatusConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('status_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['status_config'] }),
  });
}

// ── Demandas Específicas ──
export function useDemandasEspecificas(filters?: { plano_id?: string; topico_id?: string }) {
  return useQuery({
    queryKey: ['demandas_especificas', filters],
    queryFn: async () => {
      let q = supabase
        .from('demandas_especificas')
        .select('*, planos(nome, cor), topicos(nome), subtopicos(nome)')
        .order('nome_curto');
      if (filters?.plano_id) q = q.eq('plano_id', filters.plano_id);
      if (filters?.topico_id) q = q.eq('topico_id', filters.topico_id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertDemandaEspecifica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: {
      id?: string;
      nome_curto: string;
      descricao_detalhada?: string;
      plano_id?: string | null;
      topico_id?: string | null;
      subtopico_id?: string | null;
      ativo?: boolean;
    }) => {
      const payload = {
        nome_curto: d.nome_curto,
        descricao_detalhada: d.descricao_detalhada || null,
        plano_id: d.plano_id || null,
        topico_id: d.topico_id || null,
        subtopico_id: d.subtopico_id || null,
        ativo: d.ativo ?? true,
      };
      if (d.id) {
        const { error } = await supabase.from('demandas_especificas').update(payload).eq('id', d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('demandas_especificas').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demandas_especificas'] }),
  });
}

export function useDeleteDemandaEspecifica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('demandas_especificas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['demandas_especificas'] }),
  });
}

// ── Tipos de Atendimento (configurável) ──

export function useTiposAtendimentoConfig() {
  return useQuery({
    queryKey: ['tipos_atendimento_config'],
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const [tiposRes, planosRes, topicosRes, subtopicosRes] = await Promise.all([
        supabase.from('tipos_atendimento_config').select('*').order('nome'),
        supabase.from('planos').select('id, nome, cor'),
        supabase.from('topicos').select('id, nome'),
        supabase.from('subtopicos').select('id, nome'),
      ]);
      if (tiposRes.error) throw tiposRes.error;
      const planosMap = new Map((planosRes.data || []).map((p: any) => [p.id, p]));
      const topicosMap = new Map((topicosRes.data || []).map((t: any) => [t.id, t]));
      const subtopicosMap = new Map((subtopicosRes.data || []).map((s: any) => [s.id, s]));
      const data = (tiposRes.data || []).map((t: any) => ({
        ...t,
        planos: t.plano_id ? planosMap.get(t.plano_id) || null : null,
        topicos: t.topico_id ? topicosMap.get(t.topico_id) || null : null,
        subtopicos: t.subtopico_id ? subtopicosMap.get(t.subtopico_id) || null : null,
      }));
      setTiposCache(data.map((t: any) => ({
        nome: t.nome,
        descricao: t.descricao || '',
        plano: (t.planos?.nome as PlanoTipo) || 'VIP',
        topico: t.topicos?.nome || null,
        subtopico: t.subtopicos?.nome || null,
      })));
      return data;
    },
  });
}

export function useUpsertTipoAtendimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { id?: string; nome: string; descricao?: string | null; plano_id?: string | null; topico_id?: string | null; subtopico_id?: string | null; ativo?: boolean }) => {
      const payload = {
        nome: t.nome,
        descricao: t.descricao || null,
        plano_id: t.plano_id || null,
        topico_id: t.topico_id || null,
        subtopico_id: t.subtopico_id || null,
        ativo: t.ativo ?? true,
      };
      if (t.id) {
        const { error } = await supabase.from('tipos_atendimento_config').update(payload).eq('id', t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('tipos_atendimento_config').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos_atendimento_config'] }),
  });
}


export function useDeleteTipoAtendimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tipos_atendimento_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos_atendimento_config'] }),
  });
}

// ── Ações Específicas (configurável) ──
export function useAcoesEspecificasConfig() {
  return useQuery({
    queryKey: ['acoes_especificas_config'],
    staleTime: 30_000,
    retry: 1,
    queryFn: async () => {
      const [acoesRes, planosRes, topicosRes, subtopicosRes] = await Promise.all([
        supabase.from('acoes_especificas_config').select('*').order('nome'),
        supabase.from('planos').select('id, nome, cor'),
        supabase.from('topicos').select('id, nome'),
        supabase.from('subtopicos').select('id, nome'),
      ]);
      if (acoesRes.error) throw acoesRes.error;
      const planosMap = new Map((planosRes.data || []).map((p: any) => [p.id, p]));
      const topicosMap = new Map((topicosRes.data || []).map((t: any) => [t.id, t]));
      const subtopicosMap = new Map((subtopicosRes.data || []).map((s: any) => [s.id, s]));
      const data = (acoesRes.data || []).map((a: any) => ({
        ...a,
        planos: a.plano_id ? planosMap.get(a.plano_id) || null : null,
        topicos: a.topico_id ? topicosMap.get(a.topico_id) || null : null,
        subtopicos: a.subtopico_id ? subtopicosMap.get(a.subtopico_id) || null : null,
      }));
      setAcoesCache(data.map((a: any) => ({
        nome: a.nome,
        plano: (a.planos?.nome as PlanoTipo) || 'VIP',
        topico: a.topicos?.nome || null,
        subtopico: a.subtopicos?.nome || null,
      })));
      return data;
    },
  });
}

export function useUpsertAcaoEspecifica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: { id?: string; nome: string; plano_id?: string | null; topico_id?: string | null; subtopico_id?: string | null; ativo?: boolean }) => {
      const payload = {
        nome: a.nome,
        plano_id: a.plano_id || null,
        topico_id: a.topico_id || null,
        subtopico_id: a.subtopico_id || null,
        ativo: a.ativo ?? true,
      };
      if (a.id) {
        const { error } = await supabase.from('acoes_especificas_config').update(payload).eq('id', a.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('acoes_especificas_config').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acoes_especificas_config'] }),
  });
}


export function useDeleteAcaoEspecifica() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('acoes_especificas_config').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['acoes_especificas_config'] }),
  });
}
