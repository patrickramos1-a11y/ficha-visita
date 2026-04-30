import { useEffect } from 'react';
import { useAtendimento } from '@/contexts/AtendimentoContext';

/**
 * Hook to persist the current visit route in localStorage.
 * Call this in every visit page to track which step the user is on.
 */
export function useVisitRoute(route: string) {
  const { setRotaAtual } = useAtendimento();

  useEffect(() => {
    setRotaAtual(route);
  }, [route, setRotaAtual]);
}
