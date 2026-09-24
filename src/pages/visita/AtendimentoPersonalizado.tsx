import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  ClipboardCheck,
  ImagePlus,
  Link2,
  MessageSquarePlus,
  MinusCircle,
  Trash2,
  XCircle,
} from 'lucide-react';
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
import {
  buildPersonalizadoConformityReport,
  canonicalPersonalizadoResponse,
  derivePersonalizadoActivitySelections,
  formatPersonalizadoQuestion,
  shouldIncludePersonalizadoItem,
  shouldIncludePersonalizadoModule,
} from '@/lib/atendimentoPersonalizado';
import type { AtendimentoPersonalizadoItem, RespostaConformidadePersonalizada } from '@/types/atendimento';
import { cn } from '@/lib/utils';

const ANSWER_OPTIONS: Array<{
  value: RespostaConformidadePersonalizada;
  label: string;
  icon: typeof CheckCircle2;
  className: string;
}> = [
  {
    value: 'ADEQUADO',
    label: 'Sim',
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 data-[selected=true]:border-emerald-600 data-[selected=true]:bg-emerald-600 data-[selected=true]:text-white',
  },
  {
    value: 'REQUER_ATENCAO',
    label: 'Atenção',
    icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-700 data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-500 data-[selected=true]:text-white',
  },
  {
    value: 'NAO_CONFORME',
    label: 'Não',
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-700 data-[selected=true]:border-red-600 data-[selected=true]:bg-red-600 data-[selected=true]:text-white',
  },
  {
    value: 'NAO_SE_APLICA',
    label: 'N/A',
    icon: MinusCircle,
    className: 'border-slate-200 bg-slate-50 text-slate-700 data-[selected=true]:border-slate-600 data-[selected=true]:bg-slate-600 data-[selected=true]:text-white',
  },
];

const QUESTION_REWRITES: Record<string, string> = {
  'Tambores mantidos fechados e sem vazamentos.': 'Os tambores estão mantidos fechados e sem vazamentos?',
  'Ausência de mistura aparente entre resíduos comuns e contaminados.': 'A mistura aparente entre resíduos comuns e contaminados está ausente?',
};

function displayQuestion(text: string) {
  return QUESTION_REWRITES[text] ?? formatPersonalizadoQuestion(text);
}

function isAnswered(item: AtendimentoPersonalizadoItem, saved?: { resposta?: string; observacao?: string }) {
  if (item.tipo_resposta === 'REGISTRO') return Boolean(saved?.observacao?.trim());
  return Boolean(saved?.resposta);
}

type PhotoTarget = {
  moduleId: string;
  itemIds: string[];
  label: string;
};

export default function AtendimentoPersonalizado() {
  useVisitRoute('/visita/personalizado');
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const photoTargetRef = useRef<PhotoTarget | null>(null);
  const {
    data,
    updateRespostaPersonalizada,
    addFotoFile,
    removeFoto,
    setTiposAtendimento,
    setAcoesEspecificas,
  } = useAtendimento();
  const [detalheTecnico, setDetalheTecnico] = useState(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [expandedObservationIds, setExpandedObservationIds] = useState<Set<string>>(new Set());
  const steps = getVisitStepsForMode(data.modo);
  const personalizado = data.atendimento_personalizado;

  const activeModules = useMemo(
    () => (personalizado?.modulos ?? [])
      .filter((module) => shouldIncludePersonalizadoModule(personalizado, module))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [personalizado],
  );

  useEffect(() => {
    if (activeModuleIndex > Math.max(activeModules.length - 1, 0)) {
      setActiveModuleIndex(Math.max(activeModules.length - 1, 0));
    }
  }, [activeModuleIndex, activeModules.length]);

  const report = useMemo(
    () => buildPersonalizadoConformityReport(personalizado, data.fotos),
    [data.fotos, personalizado],
  );
  const automatedSelections = useMemo(
    () => derivePersonalizadoActivitySelections(personalizado),
    [personalizado],
  );

  useEffect(() => {
    if (JSON.stringify(data.tipos_atendimento) !== JSON.stringify(automatedSelections.tipos)) {
      setTiposAtendimento(automatedSelections.tipos);
    }
    if (JSON.stringify(data.acoes_especificas) !== JSON.stringify(automatedSelections.acoes)) {
      setAcoesEspecificas(automatedSelections.acoes);
    }
  }, [automatedSelections, data.acoes_especificas, data.tipos_atendimento, setAcoesEspecificas, setTiposAtendimento]);

  const responseByItem = useMemo(
    () => new Map((personalizado?.respostas ?? []).map((response) => [response.item_id, response])),
    [personalizado?.respostas],
  );
  const currentModule = activeModules[activeModuleIndex];
  const currentModuleSummary = report?.modules.find((module) => module.id === currentModule?.id);
  const currentItems = useMemo(
    () => (currentModule?.itens ?? [])
      .filter((item) => shouldIncludePersonalizadoItem(personalizado, item))
      .filter((item) => {
        if (!item.condicional_item_id || !item.condicional_resposta) return true;
        return responseByItem.get(item.condicional_item_id)?.resposta === item.condicional_resposta;
      })
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [currentModule?.itens, personalizado, responseByItem],
  );
  const modulePhotos = data.fotos.filter((photo) => photo.atendimento_personalizado_modulo_id === currentModule?.id);
  const answeredCount = currentItems.filter((item) => isAnswered(item, responseByItem.get(item.id))).length;
  const moduleComplete = currentItems.length === 0 || answeredCount === currentItems.length;
  const moduleProgress = activeModules.length ? ((activeModuleIndex + 1) / activeModules.length) * 100 : 0;
  const allItemsSelected = currentItems.length > 0 && currentItems.every((item) => selectedItemIds.includes(item.id));

  useEffect(() => {
    setSelectedItemIds([]);
  }, [currentModule?.id]);

  const openPhotoPicker = (source: 'camera' | 'gallery', target: PhotoTarget) => {
    photoTargetRef.current = target;
    if (source === 'camera') cameraInputRef.current?.click();
    else galleryInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    const target = photoTargetRef.current;
    if (!files.length || !target) return;
    try {
      for (const file of files) {
        await addFotoFile(file, 'durante', {
          detalheTecnico,
          atendimentoPersonalizadoModuloId: target.moduleId,
          atendimentoPersonalizadoItemIds: target.itemIds,
          tipoEvidencia: 'COMPROVANTE',
          legenda: target.label,
        });
      }
      toast.success(files.length === 1 ? 'Foto adicionada' : `${files.length} fotos adicionadas`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar foto');
    } finally {
      photoTargetRef.current = null;
    }
  };

  const markAllAsYes = () => {
    if (!currentModule) return;
    currentItems
      .filter((item) => item.tipo_resposta !== 'REGISTRO')
      .forEach((item) => {
        const saved = responseByItem.get(item.id);
        updateRespostaPersonalizada({
          modulo_id: currentModule.id,
          item_id: item.id,
          resposta: 'ADEQUADO',
          observacao: saved?.observacao ?? '',
        });
      });
    toast.success('Itens do módulo marcados como Sim');
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
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/responsavel')} title="Ficha personalizada">
      <ProgressStepper steps={steps} currentStep={Math.max(steps.findIndex((step) => step.id === 'personalizado'), 0)} />
      <PageHeader
        icon={ClipboardCheck}
        title={personalizado.atendimento_personalizado_nome}
        description={personalizado.cliente_nome || 'Atendimento personalizado vinculado ao cliente'}
        badge={<Badge className="bg-primary/10 text-primary">{report?.percentage ?? 'N/A'}%</Badge>}
      />

      <div className="flex-1 space-y-3 overflow-auto scroll-smooth-y px-4 pb-4">
        {currentModule ? (
          <>
            <Card className="shadow-none">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Módulo {activeModuleIndex + 1} de {activeModules.length}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold leading-tight">{currentModule.titulo}</h2>
                    {currentModule.descricao ? <p className="mt-1 text-xs text-muted-foreground">{currentModule.descricao}</p> : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0">{answeredCount}/{currentItems.length}</Badge>
                </div>
                <Progress value={moduleProgress} className="h-2" />
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {currentModuleSummary?.percentage ?? 'N/A'}% conformidade
                  </Badge>
                  <Badge variant="outline">{modulePhotos.length} fotos</Badge>
                  {moduleComplete ? <Badge className="bg-primary/10 text-primary">Módulo concluído</Badge> : null}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Camera className="h-4 w-4 text-primary" />
                  Fotos do módulo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PhotoDetailToggle checked={detalheTecnico} onCheckedChange={setDetalheTecnico} />
                {currentItems.length ? (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                        <Link2 className="h-3.5 w-3.5" />
                        Vincular aos itens
                      </p>
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-primary">
                        <input
                          type="checkbox"
                          checked={allItemsSelected}
                          onChange={(event) => setSelectedItemIds(event.target.checked ? currentItems.map((item) => item.id) : [])}
                          className="h-4 w-4 rounded border-muted-foreground"
                        />
                        Vincular todas
                      </label>
                    </div>
                    <div className="grid gap-2">
                      {currentItems.map((item) => (
                        <label key={item.id} className="flex items-start gap-2 text-sm leading-5">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(event) => setSelectedItemIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                            className="mt-1 h-4 w-4 rounded border-muted-foreground"
                          />
                          <span>{displayQuestion(item.texto)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 gap-2"
                    onClick={() => openPhotoPicker('camera', { moduleId: currentModule.id, itemIds: selectedItemIds, label: currentModule.titulo })}
                  >
                    <Camera className="h-4 w-4" />
                    Tirar foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 gap-2"
                    onClick={() => openPhotoPicker('gallery', { moduleId: currentModule.id, itemIds: selectedItemIds, label: currentModule.titulo })}
                  >
                    <ImagePlus className="h-4 w-4" />
                    Da galeria
                  </Button>
                </div>
                {modulePhotos.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {modulePhotos.map((photo, index) => (
                      <figure key={`${photo.url}-${index}`} className="overflow-hidden rounded-lg border bg-card">
                        <img src={photo.url} alt={photo.legenda || `Foto ${index + 1}`} className="aspect-square w-full object-cover" />
                        <figcaption className="flex items-center justify-between gap-2 p-2 text-[11px] text-muted-foreground">
                          <span className="truncate">{photo.legenda || 'Foto do módulo'}</span>
                          <button type="button" onClick={() => removeFoto(photo.url)} aria-label="Remover foto" className="rounded p-1 hover:bg-muted hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card key={currentModule.id} className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between gap-3 text-base">
                  <span>Itens de verificação</span>
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-emerald-700" onClick={markAllAsYes}>
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tudo sim
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentItems.map((item) => {
                  const saved = responseByItem.get(item.id);
                  const selectedResponse = canonicalPersonalizadoResponse(item, saved?.resposta ?? '');
                  const itemPhotos = modulePhotos.filter((photo) => {
                    const itemIds = photo.atendimento_personalizado_item_ids ?? [];
                    return photo.atendimento_personalizado_item_id === item.id || itemIds.includes(item.id);
                  });
                  const isRegistro = item.tipo_resposta === 'REGISTRO';
                  const observationOpen = expandedObservationIds.has(item.id) || Boolean(saved?.observacao?.trim());
                  return (
                    <div key={item.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-5">{displayQuestion(item.texto)}</p>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary"
                            title="Tirar foto deste item"
                            aria-label="Tirar foto deste item"
                            onClick={() => openPhotoPicker('camera', { moduleId: currentModule.id, itemIds: [item.id], label: displayQuestion(item.texto) })}
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-primary"
                            title="Adicionar fotos da galeria a este item"
                            aria-label="Adicionar fotos da galeria a este item"
                            onClick={() => openPhotoPicker('gallery', { moduleId: currentModule.id, itemIds: [item.id], label: displayQuestion(item.texto) })}
                          >
                            <ImagePlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {!isRegistro ? (
                        <div className="grid grid-cols-4 gap-1.5">
                          {ANSWER_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <Button
                                key={option.value}
                                type="button"
                                variant="outline"
                                data-selected={selectedResponse === option.value}
                                className={cn('h-12 min-w-0 flex-col gap-0.5 px-1 text-[10px] sm:text-xs', option.className)}
                                onClick={() => updateRespostaPersonalizada({
                                  modulo_id: currentModule.id,
                                  item_id: item.id,
                                  resposta: option.value,
                                  observacao: saved?.observacao ?? '',
                                })}
                              >
                                <Icon className="h-4 w-4" />
                                <span className="truncate">{option.label}</span>
                              </Button>
                            );
                          })}
                        </div>
                      ) : null}
                      {item.permite_observacao !== false ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => setExpandedObservationIds((current) => {
                              const next = new Set(current);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            })}
                          >
                            <span className="flex items-center gap-1.5">
                              <MessageSquarePlus className="h-3.5 w-3.5" />
                              {saved?.observacao?.trim() ? 'Observação adicionada' : isRegistro ? 'Adicionar registro' : 'Adicionar observação'}
                            </span>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', observationOpen && 'rotate-180')} />
                          </button>
                          {observationOpen ? (
                            <Textarea
                              value={saved?.observacao ?? ''}
                              onChange={(event) => updateRespostaPersonalizada({
                                modulo_id: currentModule.id,
                                item_id: item.id,
                                resposta: isRegistro ? 'REGISTRO' : saved?.resposta ?? '',
                                observacao: event.target.value,
                              })}
                              placeholder={isRegistro ? 'Registro técnico do item' : 'Observação técnica do item'}
                              className="min-h-20 resize-none text-sm"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {itemPhotos.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImagePlus className="h-3.5 w-3.5" />
                          {itemPhotos.length} foto{itemPhotos.length > 1 ? 's' : ''} vinculada{itemPhotos.length > 1 ? 's' : ''}
                        </span>
                      ) : null}
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
                navigate('/visita/responsavel');
                return;
              }
              setActiveModuleIndex((index) => Math.max(index - 1, 0));
            }}
            className="h-14 haptic-press"
          >
            <ChevronLeft className="mr-2 h-5 w-5" />
            Voltar
          </Button>
          {moduleComplete ? (
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
              {activeModuleIndex >= activeModules.length - 1 ? 'Ir para o Radar' : 'Próximo módulo'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <div className="flex h-14 items-center justify-center rounded-md border bg-muted/40 px-3 text-center text-xs text-muted-foreground">
              <CircleOff className="mr-2 h-4 w-4 shrink-0" />
              Responda todos os itens
            </div>
          )}
        </div>
      </MobileFooter>
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
    </MobileLayout>
  );
}
