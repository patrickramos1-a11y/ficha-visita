import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS_RAPIDA } from '@/components/visita/ProgressStepper';
import { MobileFooter } from '@/components/mobile';
import { Camera, AlertCircle, Check, ImagePlus, X, Image } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function FotosRapida() {
  useVisitRoute('/visita/rapida/fotos');
  const navigate = useNavigate();
  const { data, addFotoFile, removeFoto } = useAtendimento();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // For visita rápida, treat all photos as 'final' so possui_foto_final fica true
  const fotos = data.fotos;
  const podeAvancar = fotos.length >= 1;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    try {
      for (const file of files) await addFotoFile(file, 'final');
      toast.success(files.length === 1 ? 'Foto adicionada!' : `${files.length} fotos adicionadas!`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar foto no aparelho');
    }
  };

  const handleContinue = () => {
    if (!podeAvancar) {
      toast.error('Adicione pelo menos 1 foto');
      return;
    }
    navigate('/visita/resumo');
  };

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/visita/rapida/radar')} title="Fotos">
      <ProgressStepper steps={VISIT_STEPS_RAPIDA} currentStep={5} />

      <div className="px-4 py-4">
        <div className={cn(
          "flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
          podeAvancar ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-700'
        )}>
          {podeAvancar ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {podeAvancar ? `${fotos.length} foto(s) anexada(s)` : 'Anexe pelo menos 1 foto'}
          </span>
        </div>
        <p className="text-muted-foreground text-sm text-center mt-3">
          Tire fotos ou escolha da galeria para registrar a visita rápida
        </p>
      </div>

      <div className="flex-1 overflow-auto scroll-smooth-y px-4 pb-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button onClick={() => cameraInputRef.current?.click()} variant="outline" className="h-20 flex-col gap-2 haptic-press">
            <Camera className="w-7 h-7" />
            <span className="text-sm">Tirar Foto</span>
          </Button>
          <Button onClick={() => galleryInputRef.current?.click()} variant="outline" className="h-20 flex-col gap-2 haptic-press">
            <ImagePlus className="w-7 h-7" />
            <span className="text-sm">Da Galeria</span>
          </Button>
        </div>

        {fotos.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Fotos ({fotos.length})
            </p>
            <div className="grid grid-cols-2 gap-3">
              {fotos.map((foto, index) => (
                <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-muted group">
                  <img src={foto.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFoto(foto.url)}
                    className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity touch-safe"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma foto adicionada</p>
          </div>
        )}
      </div>

      <MobileFooter>
        <Button onClick={handleContinue} className="w-full h-14 text-lg haptic-press" disabled={!podeAvancar}>
          {podeAvancar ? (<><Check className="w-5 h-5 mr-2" /> Continuar para Resumo</>) : (
            <><Camera className="w-5 h-5 mr-2" /> Anexe uma foto para continuar</>
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
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </MobileLayout>
  );
}
