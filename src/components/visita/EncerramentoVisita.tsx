import { useMemo, useRef, useState, type ReactNode } from 'react';
import { format, intervalToDuration } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, Camera, CheckCircle2, Clock, FileText, ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useClientes } from '@/hooks/useClientes';
import { useResponsaveis } from '@/hooks/useResponsaveis';
import { useSaveAtendimento } from '@/hooks/useSaveAtendimento';
import type { AtendimentoData } from '@/types/atendimento';
import { cn } from '@/lib/utils';

type SummaryItem = {
  label: string;
  value: ReactNode;
};

interface EncerramentoVisitaProps {
  validateBeforeSave?: () => string | null;
  summaryItems?: SummaryItem[];
  requireFinalPhoto?: boolean;
  className?: string;
}

const MODO_LABEL: Record<string, string> = {
  completa: 'Atendimento completo',
  rapida: 'Atendimento rapido',
  obras: 'Acompanhamento de obras',
  ambiental: 'Acompanhamento ambiental',
  processos: 'Acompanhamento de processos',
};

function toInputValue(value?: Date) {
  return value ? format(value, "yyyy-MM-dd'T'HH:mm") : '';
}

function getDurationLabel(inicio: Date, fim?: Date) {
  const end = fim ?? new Date();
  if (end.getTime() < inicio.getTime()) return 'Horario final anterior ao inicial';
  const duration = intervalToDuration({ start: inicio, end });
  const parts = [
    duration.hours ? `${duration.hours}h` : '',
    duration.minutes ? `${duration.minutes}min` : '',
  ].filter(Boolean);
  return parts.length ? parts.join(' ') : 'menos de 1min';
}

function hasRadarItems(data: AtendimentoData) {
  return data.demandas.some((demanda) => demanda.descricao.trim()) || (data.anotacoes_itens ?? []).some((item) => item.texto.trim());
}

export function EncerramentoVisita({ validateBeforeSave, summaryItems = [], requireFinalPhoto = false, className }: EncerramentoVisitaProps) {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const {
    data,
    setTitulo,
    setHorarioVisita,
    addFotoFile,
    removeFoto,
    resetAtendimento,
  } = useAtendimento();
  const { data: clientes = [] } = useClientes();
  const { data: responsaveis = [] } = useResponsaveis();
  const saveAtendimento = useSaveAtendimento();
  const [showTitleError, setShowTitleError] = useState(false);

  const titulo = data.titulo?.trim() ?? '';
  const finalFotos = data.fotos.filter((foto) => foto.tipo === 'final');
  const clienteNomes = useMemo(
    () => data.cliente_ids.map((id) => clientes.find((cliente) => cliente.id === id)?.nome).filter(Boolean) as string[],
    [clientes, data.cliente_ids],
  );
  const responsavel = responsaveis.find((item) => item.id === data.responsavel_id);
  const fim = data.data_fim ?? new Date();
  const durationLabel = getDurationLabel(data.data_inicio, fim);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    try {
      for (const file of files) await addFotoFile(file, 'final');
      toast.success(files.length === 1 ? 'Foto adicionada' : `${files.length} fotos adicionadas`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar foto');
    }
  };

  const handleFinish = async () => {
    if (!titulo) {
      setShowTitleError(true);
      toast.error('Preencha o titulo da visita');
      return;
    }
    if (!data.responsavel_id) {
      toast.error('Informe o responsavel tecnico');
      return;
    }
    if (data.data_fim && data.data_fim.getTime() < data.data_inicio.getTime()) {
      toast.error('A data final nao pode ser anterior a data inicial');
      return;
    }
    if (requireFinalPhoto && finalFotos.length === 0) {
      toast.error('Inclua ao menos uma foto final');
      return;
    }
    const validation = validateBeforeSave?.();
    if (validation) {
      toast.error(validation);
      return;
    }

    const dataFim = data.data_fim ?? new Date();
    const finalData: AtendimentoData = {
      ...data,
      titulo,
      data_fim: dataFim,
      possui_foto_final: data.fotos.some((foto) => foto.tipo === 'final'),
    };

    const { localId } = await saveAtendimento.mutateAsync(finalData);
    const successState = {
      atendimentoId: localId,
      titulo,
      modo: data.modo,
      hasRadarItems: hasRadarItems(finalData),
      hasReport: data.modo === 'obras' || data.modo === 'ambiental',
    };
    resetAtendimento();
    navigate('/sucesso', { state: successState });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Card className={cn('border-border/70', !titulo && 'border-amber-300 bg-amber-50/70')}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Identificacao final</span>
            <Badge variant={titulo ? 'secondary' : 'outline'}>Titulo obrigatorio</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="titulo-encerramento">Titulo da visita</Label>
            <Input
              id="titulo-encerramento"
              value={data.titulo ?? ''}
              onChange={(event) => {
                setTitulo(event.target.value);
                if (event.target.value.trim()) setShowTitleError(false);
              }}
              placeholder={data.modo === 'rapida' ? 'Ex.: Visita rapida - vistoria pontual' : 'Ex.: Visita tecnica - ajuste da ETE'}
              className={cn('h-12 text-base', showTitleError && !titulo && 'border-amber-500 focus-visible:ring-amber-500')}
            />
            {showTitleError && !titulo && <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700"><AlertCircle className="h-3.5 w-3.5" />Preencha o titulo para concluir.</p>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Data e hora inicial</Label>
              <Input type="datetime-local" value={toInputValue(data.data_inicio)} onChange={(event) => setHorarioVisita(new Date(event.target.value), data.data_fim)} />
            </div>
            <div className="space-y-2">
              <Label>Data e hora final</Label>
              <Input type="datetime-local" value={toInputValue(fim)} onChange={(event) => setHorarioVisita(data.data_inicio, new Date(event.target.value))} />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
            <Clock className="h-4 w-4" />
            <span>Duração registrada: <strong>{durationLabel}</strong></span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm"><Camera className="h-4 w-4 text-primary" />Fotos finais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-14 gap-2" onClick={() => cameraInputRef.current?.click()}><Camera className="h-5 w-5" />Tirar foto</Button>
            <Button type="button" variant="outline" className="h-14 gap-2" onClick={() => galleryInputRef.current?.click()}><ImagePlus className="h-5 w-5" />Galeria</Button>
          </div>
          {finalFotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {finalFotos.map((foto, index) => (
                <div key={foto.fotoId ?? foto.url} className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={foto.url} alt={`Foto final ${index + 1}`} className="h-full w-full object-cover" />
                  <Button type="button" size="icon" variant="destructive" className="absolute right-1 top-1 h-7 w-7" onClick={() => removeFoto(foto.url)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Nenhuma foto final adicionada.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumo do registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <p><strong>Modalidade:</strong> {MODO_LABEL[data.modo ?? 'completa'] ?? 'Atendimento'}</p>
            <p><strong>Responsavel:</strong> {responsavel?.nome ?? 'Nao informado'}</p>
            <p><strong>Cliente(s):</strong> {clienteNomes.join(', ') || 'Nao informado'}</p>
            <p><strong>Fotos:</strong> {data.fotos.length}</p>
            <p><strong>Tipos:</strong> {data.tipos_atendimento.length}</p>
            <p><strong>Acoes:</strong> {data.acoes_especificas.length}</p>
            <p><strong>Demandas Radar:</strong> {data.demandas.filter((demanda) => demanda.descricao.trim()).length}</p>
            <p><strong>Comentarios Radar:</strong> {(data.anotacoes_itens ?? []).filter((item) => item.texto.trim()).length}</p>
            {summaryItems.map((item) => <p key={item.label}><strong>{item.label}:</strong> {item.value}</p>)}
          </div>
          <Separator />
          <Button onClick={handleFinish} disabled={saveAtendimento.isPending} className="h-14 w-full text-base">
            {saveAtendimento.isPending ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Salvando visita...</span>
            ) : (
              <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" />Concluir visita</span>
            )}
          </Button>
        </CardContent>
      </Card>

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
    </div>
  );
}
