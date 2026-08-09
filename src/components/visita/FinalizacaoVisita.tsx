import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAtendimento } from '@/contexts/AtendimentoContext';

const toInputValue = (value?: Date) => value ? format(value, "yyyy-MM-dd'T'HH:mm") : '';

export function FinalizacaoVisita() {
  const { data, setHorarioVisita } = useAtendimento();
  return <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
    <div className="space-y-2"><Label>Data e hora inicial</Label><Input type="datetime-local" value={toInputValue(data.data_inicio)} onChange={(event) => setHorarioVisita(new Date(event.target.value), data.data_fim)} /></div>
    <div className="space-y-2"><Label>Data e hora final</Label><Input type="datetime-local" value={toInputValue(data.data_fim ?? new Date())} onChange={(event) => setHorarioVisita(data.data_inicio, new Date(event.target.value))} /></div>
  </div>;
}
