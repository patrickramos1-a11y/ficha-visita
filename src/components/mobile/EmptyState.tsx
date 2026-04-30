import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
