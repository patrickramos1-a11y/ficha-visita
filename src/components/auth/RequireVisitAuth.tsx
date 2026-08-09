import { Navigate, useLocation } from 'react-router-dom';
import { useVisitAuth } from '@/contexts/AuthContext';

export function RequireVisitAuth({ children }: { children: React.ReactNode }) {
  const { loading, user } = useVisitAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando acesso...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
