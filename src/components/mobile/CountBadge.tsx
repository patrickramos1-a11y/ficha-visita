import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number;
  label?: string;
  className?: string;
}

export function CountBadge({ count, label, className }: CountBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        "text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full",
        className
      )}
    >
      {count} {label && <span className="hidden sm:inline">{label}</span>}
    </span>
  );
}
