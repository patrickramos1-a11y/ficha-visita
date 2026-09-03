import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, ChevronLeft, ChevronRight, ClipboardCheck, ImagePlus, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ProgressStepper, getVisitStepsForMode } from '@/components/visita/ProgressStepper';
import { PageHeader, MobileFooter } from '@/components/mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PhotoDetailToggle } from '@/components/visita/PhotoDetailToggle';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { buildPersonalizadoConformityReport } from '@/lib/atendimentoPersonalizado';
import type { AtendimentoPersonalizadoItem, RespostaConformidadePersonalizada, TipoEvidenciaFoto } from '@/types/atendimento';
import { cn } from '@/lib/utils';

const OPTION_CLASSES = {
  good: 'data-[selected=true]:bg-emerald-600 data-[selected=true]:text-white',
  attention: 'data-[selected=true]:bg-amber-500 data-[selected=true]:text-white',
  bad: 'data-[selected=true]:bg-red-600 data-[selected=true]:text-white',
  neutral: 'data-[selected=true]:bg-slate-600 data-[selected=true]:text-white',
};

const EVIDENCE_TYPES: Array<{ value: TipoEvidenciaFoto; label: string }> = [
  { value: 'VISAO_GERAL', label: 'Visão geral' },
  { value: 'CONFORMIDADE', label: 'Conformidade' },
  { value: 'ATENCAO', label: 'Atenção' },
  { value: 'NAO_CONFORMIDADE', label: 'Não conformidade' },
  { value: 'COMPROVANTE', label: 'Comprovante' },
  { value: 'ANTES_DEPOIS', label: 'Antes/depois' },
  { value: 'OUTRO', label: 'Outro' },
];

function getOptions(item: AtendimentoPersonalizadoItem): Array<{ value: RespostaConformidadePersonalizada; label: string; className: string }> {
  if (item.tipo_resposta === 'SIM_NAO_EVENTO') {
    return [
      { value: 'NAO', label: 'Não', className: item.resposta_positiva === 'NAO' ? OPTION_CLASSES.good : OPTION_CLASSES.bad },
      { value: 'SIM', label: 'Sim', className: item.resposta_positiva === 'SIM' ? OPTION_CLASSES.good : OPTION_CLASSES.bad },
      { value: 'NAO_SE_APLICA', label: 'N/A', className: OPTION_CLASSES.neutral },
    ];
  }
  if (item.tipo_resposta === 'NECESSIDADE_ACAO') {
    return [
      { value: 'NAO_NECESSARIA', label: 'Não necessária', className: OPTION_CLASSES.good },
      { value: 'AVALIAR', label: 'Avaliar', className: OPTION_CLASSES.attention },
      { value: 'NECESSARIA', label: 'Necessária', className: OPTION_CLASSES.bad },
      { value: 'NAO_SE_APLICA', label: 'N/A', className: OPTION_CLASSES.neutral },
    ];
  }
  return [
    { value: 'ADEQUADO', label: 'Adequado', className: OPTION_CLASSES.good },
    { value: 'REQUER_ATENCAO', label: 'Atenção', className: OPTION_CLASSES.attention },
    { value: 'NAO_CONFORME', label: 'Não conforme', className: OPTION_CLASSES.bad },
    { value: 'NAO_SE_APLICA', label: 'N/A', className: OPTION_CLASSES.neutral },
  ];
}

function isItemVisible(item: AtendimentoPersonalizadoItem, responseByItem: Map<string, { resposta: RespostaConformidadePersonalizada }>) {
  if (!item.condicional_item_id || !item.condicional_resposta) return true;
  return responseByItem.get(item.condicional_item_id)?.resposta === item.condicional_resposta;
}

export default function AtendimentoPersonalizado() {
  useVisitRoute('/visita/personalizado');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, updateRespostaPersonalizada, addFotoFile, removeFoto } = useAtendimento();
  const [detalheTecnico, setDetalheTecnico] = useState(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [photoModuleId, setPhotoModuleId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [legenda, setLegenda] = useState('');
  const [tipoEvidencia, setTipoEvidencia] = useState<TipoEvidenciaFoto>('VISAO_GERAL');
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
  const currentModuleSummary = report?.modules.find((module) => module.id === currentModule?.id);
  const currentItems = useMemo(
    () => (currentModule?.itens ?? [])
      .filter((item) => item.ativo !== false)
      .filter((item) => isItemVisible(item, responseByItem))
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
    [currentModule?.itens, responseByItem],
  );
  const modulePhotos = data.fotos.filter((foto) => foto.atendimento_personalizado_modulo_id === currentModule?.id);
  const answeredCount = currentItems.filter((item) => {
    const saved = responseByItem.get(item.id);
    return Boolean(saved?.resposta || saved?.observacao?.trim());
  }).length;
  const moduleProgress = activeModules.length ? ((activeModuleIndex + 1) / activeModules.length) * 100 : 0;

  useEffect(() => {
    setSelectedItemIds([]);
    setLegenda('');
    setTipoEvidencia('VISAO_GERAL');
  }, [currentModule?.id]);

  const handlePickModulePhotos = () => {
    if (!currentModule) return;
    setPhotoModuleId(currentModule.id);
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length || !photoModuleId) return;
    try {
      const cleanedLegenda = legenda.trim();
      for (const file of files) {
        await addFotoFile(file, 'durante', {
          detalheTecnico,
          atendimentoPersonalizadoModuloId: photoModuleId,
          atendimentoPersonalizadoItemIds: selectedItemIds,
          tipoEvidencia,
          legenda: cleanedLegenda || currentModule?.titulo || 'Foto do módulo',
        });
      }
      toast.success(files.length === 1 ? 'Foto vinculada ao módulo' : `${files.length} fotos vinculadas`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar foto');
    } finally {
      setPhotoModuleId(null);
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
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/responsavel')} title="Ficha personalizada">
      <ProgressStepper steps={steps} currentStep={2} />
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
                  <Badge variant="outline">{currentItems.length} itens</Badge>
                  <Badge variant="outline">{modulePhotos.length} fotos</Badge>
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
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input value={legenda} onChange={(event) => setLegenda(event.target.value)} placeholder="Legenda da evidência" className="h-10" />
                  <select
                    value={tipoEvidencia}
                    onChange={(event) => setTipoEvidencia(event.target.value as TipoEvidenciaFoto)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    aria-label="Tipo de evidência"
                  >
                    {EVIDENCE_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>
                {currentItems.length ? (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      Vincular aos itens
                    </p>
                    <div className="grid gap-2">
                      {currentItems.map((item) => (
                        <label key={item.id} className="flex items-start gap-2 text-sm leading-5">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(event) => setSelectedItemIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))}
                            className="mt-1 h-4 w-4 rounded border-muted-foreground"
                          />
                          <span>{item.texto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
                <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={handlePickModulePhotos}>
                  <ImagePlus className="h-4 w-4" />
                  Adicionar fotos ao módulo
                </Button>
                {modulePhotos.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {modulePhotos.map((foto, index) => (
                      <figure key={`${foto.url}-${index}`} className="overflow-hidden rounded-lg border bg-card">
                        <img src={foto.url} alt={foto.legenda || `Foto ${index + 1}`} className="aspect-square w-full object-cover" />
                        <figcaption className="space-y-1 p-2 text-[11px] text-muted-foreground">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{foto.legenda || 'Foto do módulo'}</span>
                            <button type="button" onClick={() => removeFoto(foto.url)} aria-label="Remover foto" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5">{String(foto.tipo_evidencia ?? 'VISAO_GERAL').replaceAll('_', ' ')}</span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card key={currentModule.id} className="shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Itens de verificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentItems.map((item) => {
                  const saved = responseByItem.get(item.id);
                  const itemPhotos = modulePhotos.filter((foto) => {
                    const itemIds = foto.atendimento_personalizado_item_ids ?? [];
                    return foto.atendimento_personalizado_item_id === item.id || itemIds.includes(item.id);
                  });
                  const isRegistro = item.tipo_resposta === 'REGISTRO';
                  return (
                    <div key={item.id} className="space-y-2 rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium leading-5">{item.texto}</p>
                        <div className="flex shrink-0 gap-1">
                          {isRegistro ? <Badge variant="outline" className="text-[10px]">Registro</Badge> : null}
                          {item.exige_foto ? <Badge variant={itemPhotos.length ? 'secondary' : 'outline'} className="text-[10px]">Foto</Badge> : null}
                        </div>
                      </div>
                      {!isRegistro ? (
                        <div className="grid grid-cols-2 gap-2">
                          {getOptions(item).map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant="outline"
                              data-selected={saved?.resposta === option.value || (saved?.resposta === 'CONFORME' && option.value === 'ADEQUADO') || (saved?.resposta === 'PARCIAL' && option.value === 'REQUER_ATENCAO')}
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
                      ) : null}
                      {item.permite_observacao !== false ? (
                        <Textarea
                          value={saved?.observacao ?? ''}
                          onChange={(event) => updateRespostaPersonalizada({
                            modulo_id: currentModule.id,
                            item_id: item.id,
                            resposta: isRegistro ? 'REGISTRO' : saved?.resposta ?? '',
                            observacao: event.target.value,
                          })}
                          placeholder={isRegistro ? 'Registro técnico do item' : 'Observação técnica do item'}
                          className="min-h-16 resize-none text-sm"
                        />
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
          <Button
            onClick={() => {
              if (activeModuleIndex >= activeModules.length - 1) {
                navigate('/visita/tipos');
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
