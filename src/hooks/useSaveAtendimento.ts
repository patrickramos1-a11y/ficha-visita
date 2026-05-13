import { useMutation } from '@tanstack/react-query';
import { AtendimentoData } from '@/types/atendimento';
import { toast } from 'sonner';
import { enqueueAtendimento } from '@/lib/offlineDB';
import { syncEngine } from '@/lib/syncEngine';

/**
 * Offline-first save:
 * 1. Always persist locally to IndexedDB (Dexie).
 * 2. Trigger background sync — if online, sends now; if offline, waits.
 * 3. UI never blocks on the network.
 */
export function useSaveAtendimento() {
  return useMutation({
    mutationFn: async (data: AtendimentoData) => {
      const localId = await enqueueAtendimento(data);

      // Fire-and-forget background sync (do not block UI)
      if (navigator.onLine) {
        void syncEngine.run();
      }

      return { localId };
    },
    onSuccess: () => {
      if (navigator.onLine) {
        toast.success('Atendimento salvo — enviando para o servidor');
      } else {
        toast.success('Atendimento salvo no aparelho — será enviado quando houver internet');
      }
    },
    onError: (err) => {
      console.error('Error saving atendimento locally:', err);
      toast.error('Erro ao salvar atendimento no aparelho');
    },
  });
}
