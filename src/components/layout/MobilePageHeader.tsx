import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MobilePageHeaderProps {
  title: string;
  backTo?: string;
  rightAction?: ReactNode;
  className?: string;
}

export function MobilePageHeader({ title, backTo, rightAction, className }: MobilePageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn(
      "flex items-center justify-between gap-3 mb-4",
      className
    )}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="p-1.5 -ml-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors touch-safe flex items-center justify-center shrink-0"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-foreground truncate">{title}</h1>
      </div>
      {rightAction && (
        <div className="shrink-0">{rightAction}</div>
      )}
    </div>
  );
}
