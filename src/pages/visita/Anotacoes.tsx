import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVisitRoute } from '@/hooks/useVisitRoute';

export default function Anotacoes() {
  useVisitRoute('/visita/anotacoes');
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/visita/tipos', { replace: true });
  }, [navigate]);

  return null;
}
