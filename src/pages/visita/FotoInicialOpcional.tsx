import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { useAtendimento } from '@/contexts/AtendimentoContext';
import { useVisitRoute } from '@/hooks/useVisitRoute';
import { ProgressStepper, VISIT_STEPS } from '@/components/visita/ProgressStepper';
import { Camera, SkipForward, Check, X, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

export default function FotoInicialOpcional() {
  useVisitRoute('/visita/foto-inicial');
  const navigate = useNavigate();
  const { addFoto, data } = useAtendimento();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showChoice, setShowChoice] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const fotoInicial = data.fotos.find(f => f.tipo === 'inicial');

  const handleTirarFoto = () => {
    cameraInputRef.current?.click();
  };

  const handleEscolherGaleria = () => {
    galleryInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Single file: keep preview/confirm flow
    if (files.length === 1) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedPhoto(event.target?.result as string);
        setShowChoice(false);
      };
      reader.readAsDataURL(files[0]);
      e.target.value = '';
      return;
    }

    // Multiple files: add all directly and continue
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
        urls.forEach((url) => addFoto(url, 'inicial'));
        toast.success(`${urls.length} fotos adicionadas!`);
        navigate('/visita/responsavel');
      })
      .catch(() => toast.error('Erro ao carregar uma das fotos'));

    e.target.value = '';
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      addFoto(capturedPhoto, 'inicial');
      toast.success('Foto inicial registrada!');
      navigate('/visita/responsavel');
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setShowChoice(true);
  };

  const handleSkip = () => {
    navigate('/visita/responsavel');
  };

  if (fotoInicial) {
    navigate('/visita/responsavel');
    return null;
  }

  return (
    <MobileLayout showCancelVisita showBack onBack={() => navigate('/')} title="Foto Inicial">
      <ProgressStepper steps={VISIT_STEPS} currentStep={0} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 safe-bottom">
        {showChoice && !capturedPhoto && (
          <>
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Deseja enviar uma foto inicial?</h2>
              <p className="text-muted-foreground">
                Registre o início da visita com uma foto
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <Button 
                onClick={handleTirarFoto}
                className="w-full h-14 text-base haptic-press"
              >
                <Camera className="w-5 h-5 mr-3" />
                Tirar Foto
              </Button>

              <Button 
                variant="secondary"
                onClick={handleEscolherGaleria}
                className="w-full h-14 text-base haptic-press"
              >
                <ImagePlus className="w-5 h-5 mr-3" />
                Escolher da Galeria
              </Button>

              <Button 
                variant="outline"
                onClick={handleSkip}
                className="w-full h-12 haptic-press"
              >
                <SkipForward className="w-5 h-5 mr-2" />
                Continuar sem foto
              </Button>
            </div>
          </>
        )}

        {capturedPhoto && (
          <div className="w-full max-w-md space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary shadow-lg">
              <img
                src={capturedPhoto}
                alt="Foto inicial"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleRetakePhoto}
                className="flex-1 h-14 haptic-press"
              >
                <X className="w-5 h-5 mr-2" />
                Escolher outra
              </Button>
              
              <Button 
                onClick={handleConfirmPhoto}
                className="flex-1 h-14 haptic-press"
              >
                <Check className="w-5 h-5 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>

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
