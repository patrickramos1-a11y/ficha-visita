import { useEffect, useState } from 'react';
import { Cloud, CloudOff, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSync } from '@/contexts/SyncContext';

interface Props {
  className?: string;
  compact?: boolean;
}

export function SyncStatusBadge({ className, compact = false }: Props) {
  const { isOnline, isSyncing, pendingCount, lastSyncAt } = useSync();
  const [showSyncedFlash, setShowSyncedFlash] = useState(false);

  useEffect(() => {
    if (lastSyncAt) {
      setShowSyncedFlash(true);
      const t = setTimeout(() => setShowSyncedFlash(false), 4000);
      return () => clearTimeout(t);
    }
  }, [lastSyncAt]);

  let icon = <Cloud className="w-3.5 h-3.5" />;
  let label = 'Online';
  let tone = 'bg-muted text-muted-foreground';

  if (!isOnline) {
    icon = <CloudOff className="w-3.5 h-3.5" />;
    label = pendingCount > 0
      ? `Offline — ${pendingCount} pendente${pendingCount > 1 ? 's' : ''}`
      : 'Offline — dados salvos no aparelho';
    tone = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
  } else if (isSyncing) {
    icon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    label = pendingCount > 0
      ? `Sincronizando ${pendingCount} item${pendingCount > 1 ? 's' : ''}…`
      : 'Sincronizando…';
    tone = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
  } else if (pendingCount > 0) {
    icon = <CloudOff className="w-3.5 h-3.5" />;
    label = `${pendingCount} pendente${pendingCount > 1 ? 's' : ''} para enviar`;
    tone = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
  } else if (showSyncedFlash) {
    icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    label = 'Sincronizado';
    tone = 'bg-primary/10 text-primary border-primary/30';
  } else if (compact) {
    return null; // hide when everything is fine on compact mobile header
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium',
        tone,
        className,
      )}
      title={label}
    >
      {icon}
      {!compact && <span className="truncate max-w-[200px]">{label}</span>}
      {compact && pendingCount > 0 && <span>{pendingCount}</span>}
    </div>
  );
}
