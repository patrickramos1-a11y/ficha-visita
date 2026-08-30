import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, ChevronRight, ClipboardCheck, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ProgressStepper, getVisitStepsForMode } from '@/components/visita/ProgressStepper';
import { PageHeader, MobileFooter } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PhotoDetailToggle } from '@/components/visita/PhotoDetailToggle';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { buildPersonalizadoConformityReport } from '@/lib/atendimentoPersonalizado';
import type { RespostaConformidadePersonalizada } from '@/types/atendimento';
import { cn } from '@/lib/utils';

const OPTIONS: Array<{ value: RespostaConformidadePersonalizada; label: string; className: string }> = [
  { value: 'CONFORME', label: 'Conforme', className: 'data-[selected=true]:bg-emerald-600 data-[selected=true]:text-white' },
  { value: 'PARCIAL', label: 'Parcial', className: 'data-[selected=true]:bg-amber-500 data-[selected=true]:text-white' },
  { value: 'NAO_CONFORME', label: 'Não conforme', className: 'data-[selected=true]:bg-red-600 data-[selected=true]:text-white' },
  { value: 'NAO_SE_APLICA', label: 'N/A', className: 'data-[selected=true]:bg-slate-600 data-[selected=true]:text-white' },
];

export default function AtendimentoPersonalizado() {
  useVisitRoute('/visita/personalizado');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, updateRespostaPersonalizada, addFotoFile } = useAtendimento();
  const [photoTarget, setPhotoTarget] = useState<{ moduloId: string; itemId: string; legenda: string } | null>(null);
  const [detalheTecnico, setDetalheTecnico] = useState(false);
  const steps = getVisitStepsForMode(data.modo);
  const personalizado = data.atendimento_personalizado;

  const report = useMemo(
    () => buildPersonalizadoConformityReport(personalizado, data.fotos as any),
    [data.fotos, personalizado],
  );

  const responseByItem = useMemo(() => new Map((personalizado?.respostas ?? []).map((resposta) => [resposta.item_id, resposta])), [personalizado?.respostas]);

  const handlePickPhoto = (moduloId: string, itemId: string, legenda: string) => {
    setPhotoTarget({ moduloId, itemId, legenda });
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length || !photoTarget) return;
    try {
      for (const file of files) {
        await addFotoFile(file, 'durante', {
          detalheTecnico,
          atendimentoPersonalizadoModuloId: photoTarget.moduloId,
          atendimentoPersonalizadoItemId: photoTarget.itemId,
          legenda: photoTarget.legenda,
        });
      }
      toast.success(files.length === 1 ? 'Foto vinculada ao item' : `${files.length} fotos vinculadas`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar foto');
    } finally {
      setPhotoTarget(null);
    }
  };

  if (!personalizado) {
    return (
      <MobileLayout showCancelVisita showBack onBack={() => navigate('/desktop/iniciar-visita')} title="Atendimento personalizado">
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div className="max-w-sm space-y-3">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
            <h1 className="text-xl font-semibold">Ficha não carregada</h1>
            <p className="text-sm text-muted-foreground">Inicie a visita novamente e selecione um atendimento personalizado ativo.</p>
            <Button onClick={() => navigate('/desktop/iniciar-visita')}>Voltar ao início</Button>
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/acoes')} title="Ficha personalizada">
      <ProgressStepper steps={steps} currentStep={4} />
      <PageHeader
        icon={ClipboardCheck}
        title={personalizado.atendimento_personalizado_nome}
        description={personalizado.cliente_nome || 'Atendimento personalizado vinculado ao cliente'}
        badge={<Badge className="bg-primary/10 text-primary">{report?.percentage ?? 'N/A'}%</Badge>}
      />

      <div className="flex-1 space-y-3 overflow-auto scroll-smooth-y px-4 pb-4">
        <PhotoDetailToggle checked={detalheTecnico} onCheckedChange={setDetalheTecnico} />
        {personalizado.modulos.map((modulo) => (
          <Card key={modulo.id} className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{modulo.titulo}</CardTitle>
              {modulo.descricao ? <p className="text-xs text-muted-foreground">{modulo.descricao}</p> : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {(modulo.itens ?? []).filter((item) => item.ativo !== false).map((item) => {
                const saved = responseByItem.get(item.id);
                const itemPhotos = data.fotos.filter((foto) => foto.atendimento_personalizado_item_id === item.id);
                return (
                  <div key={item.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-5">{item.texto}</p>
                      {item.exige_foto ? <Badge variant={itemPhotos.length ? 'secondary' : 'outline'} className="shrink-0 text-[10px]">Foto</Badge> : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {OPTIONS.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant="outline"
                          data-selected={saved?.resposta === option.value}
                          className={cn('h-10 text-xs', option.className)}
                          onClick={() => updateRespostaPersonalizada({
                            modulo_id: modulo.id,
                            item_id: item.id,
                            resposta: option.value,
                            observacao: saved?.observacao ?? '',
                          })}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                    {item.permite_observacao !== false ? (
                      <Textarea
                        value={saved?.observacao ?? ''}
                        onChange={(event) => updateRespostaPersonalizada({
                          modulo_id: modulo.id,
                          item_id: item.id,
                          resposta: saved?.resposta ?? '',
                          observacao: event.target.value,
                        })}
                        placeholder="Observação técnica do item"
                        className="min-h-16 resize-none text-sm"
                      />
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handlePickPhoto(modulo.id, item.id, item.texto)}>
                        <Camera className="h-4 w-4" />
                        Foto do item
                      </Button>
                      {itemPhotos.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><ImagePlus className="h-3.5 w-3.5" />{itemPhotos.length}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      <MobileFooter>
        <Button onClick={() => navigate('/visita/demandas')} className="h-14 w-full text-lg haptic-press">
          Continuar
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </MobileFooter>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileChange} />
    </MobileLayout>
  );
}
