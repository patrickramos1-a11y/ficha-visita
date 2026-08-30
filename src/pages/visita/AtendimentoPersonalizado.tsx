import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, ClipboardCheck, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ProgressStepper, getVisitStepsForMode } from '@/components/visita/ProgressStepper';
import { PageHeader, MobileFooter } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const steps = getVisitStepsForMode(data.modo);
  const personalizado = data.atendimento_personalizado;

  const activeModules = useMemo(
    () => (personalizado?.modulos ?? [])
      .filter((modulo) => modulo.ativo !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [personalizado?.modulos],
  );

  useEffect(() => {
    if (activeModuleIndex > Math.max(activeModules.length - 1, 0)) {
      setActiveModuleIndex(Math.max(activeModules.length - 1, 0));
    }
  }, [activeModuleIndex, activeModules.length]);

  const report = useMemo(
    () => buildPersonalizadoConformityReport(personalizado, data.fotos as any),
    [data.fotos, personalizado],
  );

  const responseByItem = useMemo(() => new Map((personalizado?.respostas ?? []).map((resposta) => [resposta.item_id, resposta])), [personalizado?.respostas]);
  const currentModule = activeModules[activeModuleIndex];
  const currentModuleSummary = report?.modules.find((module) => module.moduleId === currentModule?.id);
  const currentItems = useMemo(
    () => (currentModule?.itens ?? [])
      .filter((item) => item.ativo !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [currentModule?.itens],
  );
  const answeredCount = currentItems.filter((item) => Boolean(responseByItem.get(item.id)?.resposta)).length;
  const moduleProgress = activeModules.length ? ((activeModuleIndex + 1) / activeModules.length) * 100 : 0;

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
        {currentModule ? (
          <>
            <Card className="shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Módulo {activeModuleIndex + 1} de {activeModules.length}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold leading-tight">{currentModule.titulo}</h2>
                    {currentModule.descricao ? <p className="mt-1 text-xs text-muted-foreground">{currentModule.descricao}</p> : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {answeredCount}/{currentItems.length}
                  </Badge>
                </div>
                <Progress value={moduleProgress} className="h-2" />
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {currentModuleSummary?.percentage ?? 'N/A'}% conformidade
                  </Badge>
                  <Badge variant="outline">
                    {currentItems.length} itens
                  </Badge>
                  {currentItems.some((item) => item.exige_foto) ? (
                    <Badge variant="outline">
                      fotos técnicas previstas
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card key={currentModule.id} className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Itens de verificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentItems.map((item) => {
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
                              modulo_id: currentModule.id,
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
                            modulo_id: currentModule.id,
                            item_id: item.id,
                            resposta: saved?.resposta ?? '',
                            observacao: event.target.value,
                          })}
                          placeholder="Observação técnica do item"
                          className="min-h-16 resize-none text-sm"
                        />
                      ) : null}
                      <div className="flex items-center justify-between gap-2">
                        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handlePickPhoto(currentModule.id, item.id, item.texto)}>
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
          </>
        ) : (
          <Card className="shadow-none">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Nenhum módulo ativo foi cadastrado para esta ficha personalizada.
            </CardContent>
          </Card>
        )}
      </div>

      <MobileFooter>
        <div className="grid w-full grid-cols-[0.85fr_1fr] gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (activeModuleIndex === 0) {
                navigate('/visita/acoes');
                return;
              }
              setActiveModuleIndex((index) => Math.max(index - 1, 0));
            }}
            className="h-14 haptic-press"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
          <Button
            onClick={() => {
              if (activeModuleIndex >= activeModules.length - 1) {
                navigate('/visita/demandas');
                return;
              }
              setActiveModuleIndex((index) => index + 1);
            }}
            className="h-14 haptic-press"
          >
            {activeModuleIndex >= activeModules.length - 1 ? 'Continuar' : 'Próximo módulo'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </MobileFooter>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileChange} />
    </MobileLayout>
  );
}
