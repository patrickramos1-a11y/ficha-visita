import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import logoHorizontal from '@/assets/logo-horizontal.png';
import { cn } from '@/lib/utils';
import { CancelarVisitaButton } from '@/components/visita/CancelarVisitaButton';

interface MobileLayoutProps {
  children: ReactNode;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
  className?: string;
  showCancelVisita?: boolean;
}

export function MobileLayout({ 
  children, 
  showLogo = true,
  showBack = false,
  onBack,
  title,
  className,
  showCancelVisita = false,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with safe area */}
      <header className={cn(
        "sticky top-0 z-50 bg-card border-b border-border",
        "px-4 py-3 safe-top",
        "flex items-center justify-center"
      )}>
        {showBack && onBack && (
          <button
            onClick={onBack}
            className={cn(
              "absolute left-2 p-2 rounded-lg touch-safe",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              "transition-colors haptic-press",
              "flex items-center justify-center"
            )}
            aria-label="Voltar"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        
        {showLogo ? (
          <img 
            src={logoHorizontal} 
            alt="Ramos Engenharia" 
            className="h-10 object-contain"
          />
        ) : (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}

        {showCancelVisita && (
          <div className="absolute right-2">
            <CancelarVisitaButton />
          </div>
        )}
      </header>

      {/* Content */}
      <main className={cn(
        "flex-1 flex flex-col overflow-hidden",
        className
      )}>
        {children}
      </main>
    </div>
  );
}
