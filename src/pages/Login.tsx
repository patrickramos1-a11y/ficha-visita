import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useVisitAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { user, signIn } = useVisitAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to={(location.state as any)?.from || '/desktop/iniciar-visita'} replace />;
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); setError(await signIn(email, password)); setLoading(false); };
  return <main className="grid min-h-screen place-items-center bg-muted/30 p-4"><form onSubmit={submit} className="w-full max-w-sm space-y-5 border bg-card p-6 shadow-sm"><div><h1 className="text-xl font-semibold">Ficha de Visita</h1><p className="mt-1 text-sm text-muted-foreground">Entre para registrar e encaminhar as visitas.</p></div><div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div><div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={loading}><LogIn className="mr-2 h-4 w-4" />{loading ? 'Entrando...' : 'Entrar'}</Button></form></main>;
}
