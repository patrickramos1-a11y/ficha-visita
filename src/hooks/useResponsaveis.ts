import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Responsavel } from '@/types/atendimento';
import { getCache, setCache } from '@/lib/offlineDB';

const CACHE_KEY = 'responsaveis';

export function useResponsaveis() {
  return useQuery({
    queryKey: [CACHE_KEY],
    networkMode: 'offlineFirst',
    queryFn: async () => {
      const cached = (await getCache<Responsavel[]>(CACHE_KEY)) ?? [];

      if (!navigator.onLine) return cached;

      try {
        const { data, error } = await supabase
          .from('responsaveis')
          .select('*')
          .eq('ativo', true)
          .order('nome');
        if (error) throw error;
        const fresh = (data as Responsavel[]) ?? [];
        await setCache(CACHE_KEY, fresh);
        return fresh;
      } catch (e) {
        console.warn('useResponsaveis: falling back to cache', e);
        return cached;
      }
    },
  });
}
