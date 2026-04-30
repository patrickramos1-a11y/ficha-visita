import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("px-4 py-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
          <h2 className="font-semibold text-lg">{title}</h2>
        </div>
        {badge}
      </div>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  );
}
