import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { MobileFooter } from '@/components/mobile';
import { Camera, AlertCircle, Check, ImagePlus, X, Image } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FotoFinalObrigatoria() {
  useVisitRoute('/visita/foto-final');
  const navigate = useNavigate();
  const { data, addFoto, removeFoto } = useAtendimento();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const finalFotos = data.fotos.filter(f => f.tipo === 'final');
  const temFotoInicial = data.fotos.some(f => f.tipo === 'inicial');
  const temFotoFinal = finalFotos.length > 0;
  
  const totalFotos = data.fotos.length;
  const podeAvancar = totalFotos >= 1;

  const handleTirarFoto = () => {
    cameraInputRef.current?.click();
  };

  const handleEscolherGaleria = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    Promise.all(
      files.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    )
      .then((urls) => {
        urls.forEach((url) => addFoto(url, 'final'));
        toast.success(
          urls.length === 1
            ? 'Foto final adicionada!'
            : `${urls.length} fotos adicionadas!`
        );
      })
      .catch(() => toast.error('Erro ao carregar uma das fotos'));

    e.target.value = '';
  };

  const handleRemovePhoto = (url: string) => {
    removeFoto(url);
  };

  const handleContinue = () => {
    if (!podeAvancar) {
      toast.error('É necessário pelo menos 1 foto no atendimento');
      return;
    }
    navigate('/visita/resumo');
  };

  const getStatusMessage = () => {
    if (temFotoInicial && temFotoFinal) {
      return { text: 'Fotos inicial e final anexadas', variant: 'success' as const };
    }
    if (temFotoInicial) {
      return { text: 'Foto inicial anexada - final opcional', variant: 'success' as const };
    }
    if (temFotoFinal) {
      return { text: 'Foto final anexada', variant: 'success' as const };
    }
    return { text: 'Anexe pelo menos 1 foto', variant: 'warning' as const };
  };

  const status = getStatusMessage();

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/clientes')} title="Foto Final">
      <ProgressStepper steps={VISIT_STEPS} currentStep={7} />
      
      {/* Status Banner */}
      <div className="px-4 py-4">
        <div className={cn(
          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
          status.variant === 'success' 
            ? 'bg-primary/10 text-primary' 
            : 'bg-amber-500/10 text-amber-700'
        )}>
          {status.variant === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="text-sm font-medium">{status.text}</span>
        </div>
        <p className="text-muted-foreground text-sm text-center mt-3">
          {temFotoInicial 
            ? 'Você já enviou uma foto inicial. A foto final é opcional.'
            : 'Envie a foto final para concluir a visita'}
        </p>
      </div>

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4 space-y-4">
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleTirarFoto}
            variant="outline"
            className="h-20 flex-col gap-2 haptic-press"
          >
            <Camera className="w-7 h-7" />
            <span className="text-sm">Tirar Foto</span>
          </Button>
          <Button
            onClick={handleEscolherGaleria}
            variant="outline"
            className="h-20 flex-col gap-2 haptic-press"
          >
            <ImagePlus className="w-7 h-7" />
            <span className="text-sm">Da Galeria</span>
          </Button>
        </div>

        {/* Photos grid */}
        {finalFotos.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Fotos finais ({finalFotos.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {finalFotos.map((foto, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-muted group">
                  <img
                    src={foto.url}
                    alt={`Foto final ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemovePhoto(foto.url)}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-safe"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-lg">
                      Principal
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {finalFotos.length === 0 && (
          <div className="text-center py-8">
            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma foto final adicionada</p>
          </div>
        )}
      </div>

      <MobileFooter>
        <Button 
          onClick={handleContinue} 
          className="w-full h-14 text-lg haptic-press"
          disabled={!podeAvancar}
        >
          {podeAvancar ? (
            <>
              <Check className="w-5 h-5 mr-2" />
              Continuar para Resumo
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Anexe uma foto para continuar
            </>
          )}
        </Button>
      </MobileFooter>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </MobileLayout>
  );
}
