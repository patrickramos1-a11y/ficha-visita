import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  description?: string;
  className?: string;
  showCheckbox?: boolean;
}

export function SelectionCard({
  children,
  selected = false,
  onClick,
  description,
  className,
  showCheckbox = true,
}: SelectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all card-press",
        "bg-card hover:bg-accent/50",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-base block">{children}</span>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {showCheckbox && (
          <div
            className={cn(
              "w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all",
              selected
                ? "bg-primary text-primary-foreground"
                : "border-2 border-muted-foreground/30"
            )}
          >
            {selected && <Check className="w-4 h-4" />}
          </div>
        )}
      </div>
    </button>
  );
}
