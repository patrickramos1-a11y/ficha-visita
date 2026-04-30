import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Check, SwitchCamera } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageUrl: string) => void;
  onSkip?: () => void;
  instruction?: string;
}

export function CameraCapture({ onCapture, onSkip, instruction }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Não foi possível acessar a câmera. Por favor, permita o acesso.');
    } finally {
      setIsLoading(false);
    }
  }, [stream]);

  const switchCamera = () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to video size (horizontal)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to data URL
    const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageUrl);
    
    // Stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  // Start camera on mount
  useState(() => {
    startCamera('environment');
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 space-y-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <Camera className="w-10 h-10 text-destructive" />
        </div>
        <p className="text-center text-muted-foreground">{error}</p>
        <Button onClick={() => startCamera(facingMode)}>
          Tentar Novamente
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Pular esta etapa
          </Button>
        )}
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 relative bg-black flex items-center justify-center">
          <img 
            src={capturedImage} 
            alt="Foto capturada" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        <div className="p-4 bg-card border-t border-border space-y-3">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-14"
              onClick={retake}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Tirar Outra
            </Button>
            <Button 
              className="flex-1 h-14"
              onClick={confirmPhoto}
            >
              <Check className="w-5 h-5 mr-2" />
              Usar Foto
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {instruction && (
        <div className="p-4 bg-primary/10 border-b border-primary/20">
          <p className="text-center text-sm text-primary font-medium">{instruction}</p>
        </div>
      )}
      
      <div className="flex-1 relative bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onLoadedMetadata={() => setIsLoading(false)}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* Camera switch button */}
        <button
          onClick={switchCamera}
          className="absolute top-4 right-4 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          aria-label="Alternar câmera"
        >
          <SwitchCamera className="w-6 h-6" />
        </button>

        {/* Horizontal guide lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
          <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
        </div>
      </div>

      <div className="p-4 bg-card border-t border-border">
        <Button 
          onClick={capturePhoto}
          disabled={isLoading || !stream}
          className="w-full h-16 text-lg"
        >
          <Camera className="w-6 h-6 mr-3" />
          Tirar Foto
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
