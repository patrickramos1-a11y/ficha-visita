import { ScanSearch } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PhotoDetailToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function PhotoDetailToggle({ checked, onCheckedChange, className }: PhotoDetailToggleProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2.5 text-left',
        checked ? 'border-primary/40 bg-primary/5' : 'border-border',
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ScanSearch className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Detalhe técnico</span>
          <span className="block text-xs text-muted-foreground">
            Para placas, etiquetas, documentos, medições e números.
          </span>
        </span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
