import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Cliente } from '@/types/atendimento';
import { enqueueCliente, getCache, listPendingClientes, setCache } from '@/lib/offlineDB';
import { syncEngine } from '@/lib/syncEngine';

const CACHE_KEY = 'clientes';

export function useClientes() {
  return useQuery({
    queryKey: [CACHE_KEY],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      // Try cache first for instant offline render
      const cached = (await getCache<Cliente[]>(CACHE_KEY)) ?? [];
      const pending = await listPendingClientes();
      const pendingAsClientes: Cliente[] = pending.map((p) => ({
        id: p.localId,
        nome: p.nome,
        created_at: p.createdAt,
      }));

      if (!navigator.onLine) {
        return mergeClientes(cached, pendingAsClientes);
      }

      try {
        const { data, error } = await supabase.from('clientes').select('*').order('nome');
        if (error) throw error;
        const fresh = (data as Cliente[]) ?? [];
        await setCache(CACHE_KEY, fresh);
        return mergeClientes(fresh, pendingAsClientes);
      } catch (e) {
        console.warn('useClientes: falling back to cache', e);
        return mergeClientes(cached, pendingAsClientes);
      }
    },
  });
}

function mergeClientes(remote: Cliente[], pending: Cliente[]): Cliente[] {
  const ids = new Set(remote.map((c) => c.id));
  const merged = [...remote, ...pending.filter((p) => !ids.has(p.id))];
  return merged.sort((a, b) => a.nome.localeCompare(b.nome));
}

export function useCreateCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      // If online, try direct insert so we get a server-assigned record immediately
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from('clientes')
          .insert({ nome })
          .select()
          .single();
        if (!error && data) return data as Cliente;
        // fall through to local enqueue if it failed
      }

      const row = await enqueueCliente(nome);
      if (navigator.onLine) void syncEngine.run();
      return {
        id: row.localId,
        nome: row.nome,
        created_at: row.createdAt,
      } as Cliente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEY] });
    },
  });
}
