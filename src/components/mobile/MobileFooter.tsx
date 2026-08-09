import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileFooterProps {
  children: ReactNode;
  className?: string;
}

export function MobileFooter({ children, className }: MobileFooterProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 bg-card border-t border-border px-4 pb-[calc(0.75rem+var(--safe-area-inset-bottom))] pt-3",
        "shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]",
        className
      )}
    >
      {children}
    </div>
  );
}
