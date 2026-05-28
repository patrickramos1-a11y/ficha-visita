import { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionChipProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  meta?: string;
  className?: string;
}

export function SelectionChip({
  children,
  selected = false,
  onClick,
  onRemove,
  meta,
  className,
}: SelectionChipProps) {
  if (selected && onRemove) {
    return (
      <button
        onClick={onRemove}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all haptic-press",
          "bg-primary text-primary-foreground",
          className
        )}
      >
        <Check className="w-4 h-4" />
        <span className="flex flex-col items-start leading-tight">
          <span>{children}</span>
          {meta && <span className="text-[11px] font-normal opacity-85">{meta}</span>}
        </span>
        <X className="w-3 h-3 opacity-70" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-4 py-2.5 rounded-full text-sm font-medium transition-all haptic-press",
        "bg-card border border-border hover:border-primary hover:bg-accent/50",
        className
      )}
    >
      <span className="flex flex-col items-start leading-tight">
        <span>{children}</span>
        {meta && <span className="text-[11px] font-normal text-primary mt-0.5">{meta}</span>}
      </span>
    </button>
  );
}
