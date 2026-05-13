import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { syncEngine } from '@/lib/syncEngine';
import { countPending } from '@/lib/offlineDB';
import { toast } from 'sonner';

interface SyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: Date | null;
  triggerSync: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const wasOffline = useRef(!isOnline);

  const refreshPending = useCallback(async () => {
    try {
      setPendingCount(await countPending());
    } catch {
      /* dexie may not be ready yet */
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    const result = await syncEngine.run();
    await refreshPending();
    if (result.ok && (result.sentAtendimentos > 0 || result.sentClientes > 0)) {
      setLastSyncAt(new Date());
      const total = result.sentAtendimentos + result.sentClientes;
      toast.success(
        total === 1
          ? '1 registro sincronizado com o servidor'
          : `${total} registros sincronizados com o servidor`,
      );
    } else if (!result.ok) {
      toast.error('Falha ao sincronizar — tentaremos de novo automaticamente');
    }
  }, [refreshPending]);

  // Subscribe to engine running state
  useEffect(() => {
    return syncEngine.subscribe(() => {
      setIsSyncing(syncEngine.isRunning());
      void refreshPending();
    });
  }, [refreshPending]);

  // Initial pending count + sync on app load if online
  useEffect(() => {
    void (async () => {
      await refreshPending();
      if (navigator.onLine) {
        void triggerSync();
      }
    })();
  }, [refreshPending, triggerSync]);

  // Auto-sync on connection regained
  useEffect(() => {
    if (isOnline && wasOffline.current) {
      void triggerSync();
    }
    wasOffline.current = !isOnline;
  }, [isOnline, triggerSync]);

  return (
    <SyncContext.Provider
      value={{ isOnline, isSyncing, pendingCount, lastSyncAt, triggerSync, refreshPending }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
