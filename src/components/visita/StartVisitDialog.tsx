import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useAtendimentoPersonalizadoDetalhe, useAtendimentosPersonalizados } from '@/hooks/useAtendimentosPersonalizados';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Zap, ChevronRight, Hammer, Leaf, Landmark, SlidersHorizontal } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function StartVisitDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { iniciarVisita, iniciarVisitaPersonalizada } = useAtendimento();
  const [customMode, setCustomMode] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [personalizadoId, setPersonalizadoId] = useState('');
  const { data: clientes = [] } = useClientes();
  const { data: personalizados = [], isLoading: loadingPersonalizados } = useAtendimentosPersonalizados(clienteId || undefined);
  const { data: personalizadoDetalhe, isLoading: loadingDetalhe } = useAtendimentoPersonalizadoDetalhe(personalizadoId || null);

  const start = (modo: 'completa' | 'rapida' | 'obras' | 'ambiental' | 'processos') => {
    iniciarVisita(modo);
    onOpenChange(false);
    setCustomMode(false);
    navigate('/visita/foto-inicial');
  };

  const startPersonalizado = () => {
    if (!personalizadoDetalhe) return;
    iniciarVisitaPersonalizada({
      atendimento_personalizado_id: personalizadoDetalhe.id,
      atendimento_personalizado_nome: personalizadoDetalhe.nome,
      cliente_id: personalizadoDetalhe.cliente_id,
      cliente_nome: personalizadoDetalhe.cliente?.nome,
      responsavel_id: personalizadoDetalhe.responsavel_padrao_id,
      tipos: personalizadoDetalhe.tipos ?? [],
      acoes: personalizadoDetalhe.acoes ?? [],
      modulos: personalizadoDetalhe.modulos ?? [],
    });
    onOpenChange(false);
    setCustomMode(false);
    navigate('/visita/foto-inicial');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Como será essa visita?</DialogTitle>
          <DialogDescription>
            Escolha o tipo de visita conforme a situação.
          </DialogDescription>
        </DialogHeader>

        {customMode ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={clienteId} onValueChange={(value) => { setClienteId(value); setPersonalizadoId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Atendimento ativo</label>
              <Select value={personalizadoId} onValueChange={setPersonalizadoId} disabled={!clienteId || loadingPersonalizados}>
                <SelectTrigger><SelectValue placeholder={clienteId ? 'Selecione a ficha' : 'Escolha o cliente primeiro'} /></SelectTrigger>
                <SelectContent>
                  {personalizados.filter((item) => item.status !== 'inativo').map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clienteId && !loadingPersonalizados && personalizados.filter((item) => item.status !== 'inativo').length === 0 ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Esse cliente ainda não possui atendimento personalizado ativo. Cadastre em Clientes.
                </p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCustomMode(false)}>Voltar</Button>
              <Button type="button" className="flex-1" disabled={!personalizadoDetalhe || loadingDetalhe} onClick={startPersonalizado}>
                Iniciar ficha
              </Button>
            </div>
          </div>
        ) : (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => start('completa')}
            className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Visita Completa</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fluxo completo com checklist, anotações, tipos, ações, demandas e fotos.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => start('rapida')}
            className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Visita Rápida</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Para registros pontuais (15–20 min) sem contato direto. Apenas tipos, cliente, técnico e fotos.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => start('obras')}
            className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <Hammer className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">Acompanhamento de Obras</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fluxo fixo para registrar status, ambiente, segurança, resíduos, drenagem e pendências da obra.
                </p>
              </div>
            </div>
          </button>

          <button type="button" onClick={() => start('ambiental')} className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-lime-500/10 text-lime-700 flex items-center justify-center flex-shrink-0"><Leaf className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Acompanhamento Ambiental</p><ChevronRight className="w-4 h-4 text-muted-foreground" /></div><p className="text-xs text-muted-foreground mt-1">Fluxo para resíduos, ETE, água, documentos ambientais, orientações e levantamentos.</p></div>
            </div>
          </button>

          <button type="button" onClick={() => start('processos')} className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe">
            <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-700 flex items-center justify-center flex-shrink-0"><Landmark className="w-5 h-5" /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Acompanhamento de Processos</p><ChevronRight className="w-4 h-4 text-muted-foreground" /></div><p className="text-xs text-muted-foreground mt-1">Registre órgãos, processos, ações, demandas e anotações do cliente.</p></div></div>
          </button>

          <button type="button" onClick={() => setCustomMode(true)} className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors haptic-press touch-safe">
            <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-700 flex items-center justify-center flex-shrink-0"><SlidersHorizontal className="w-5 h-5" /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="font-semibold">Atendimento Personalizado</p><ChevronRight className="w-4 h-4 text-muted-foreground" /></div><p className="text-xs text-muted-foreground mt-1">Execute uma ficha técnica específica cadastrada para um cliente.</p></div></div>
          </button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
