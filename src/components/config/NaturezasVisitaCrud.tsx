import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const defaults = [
  { codigo: 'ATENDIMENTO', nome: 'Visita de Atendimento' },
  { codigo: 'OBRAS', nome: 'Acompanhamento de Obras' },
  { codigo: 'AMBIENTAL', nome: 'Acompanhamento Ambiental' },
  { codigo: 'PROCESSOS', nome: 'Acompanhamento de Processos' },
];

export function NaturezasVisitaCrud() {
  const client = useQueryClient();
  const db = supabase as any;
  const { data = [] } = useQuery({ queryKey: ['naturezas-visita'], retry: false, queryFn: async () => { const { data, error } = await db.from('naturezas_visita').select('*').order('ordem'); return error ? [] : data ?? []; } });
  const rows = data.length ? data : defaults.map(item => ({ ...item, ativo: true }));
  const toggle = async (item: any) => { const { error } = await db.from('naturezas_visita').update({ ativo: !item.ativo }).eq('codigo', item.codigo); if (error) return toast.error('Aplique primeiro o SQL de naturezas no Supabase'); client.invalidateQueries({ queryKey: ['naturezas-visita'] }); };
  const rename = async (item: any, nome: string) => { if (!nome.trim() || nome.trim() === item.nome) return; const { error } = await db.from('naturezas_visita').update({ nome: nome.trim() }).eq('codigo', item.codigo); if (error) return toast.error('Aplique primeiro o SQL de naturezas no Supabase'); client.invalidateQueries({ queryKey: ['naturezas-visita'] }); };
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">As quatro naturezas são fixas. Você pode renomeá-las, ativá-las ou desativá-las conforme o uso.</p>{rows.map((item: any) => <div key={item.codigo} className="flex items-center justify-between gap-4 border-b py-3"><div className="min-w-0 flex-1"><Input defaultValue={item.nome} onBlur={event => void rename(item, event.target.value)} /><p className="mt-1 text-xs text-muted-foreground">{item.codigo}</p></div><div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{item.ativo ? 'Ativa' : 'Inativa'}</span><Switch checked={item.ativo} onCheckedChange={() => toggle(item)} /></div></div>)}</div>;
}
