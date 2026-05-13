import { supabase } from '@/integrations/supabase/client';
import { getPlanoFromTipo } from '@/types/tiposAtendimentoConfig';
import {
  listPendingAtendimentos,
  listPendingClientes,
  removeAtendimento,
  removeCliente,
  setAtendimentoStatus,
  setClienteStatus,
} from '@/lib/offlineDB';
import { AtendimentoData } from '@/types/atendimento';

type Listener = () => void;

class SyncEngine {
  private running = false;
  private listeners = new Set<Listener>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelays = [30_000, 60_000, 5 * 60_000, 15 * 60_000];
  private retryIndex = 0;

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  isRunning() {
    return this.running;
  }

  async run(): Promise<{ ok: boolean; sentAtendimentos: number; sentClientes: number }> {
    if (this.running) return { ok: false, sentAtendimentos: 0, sentClientes: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { ok: false, sentAtendimentos: 0, sentClientes: 0 };
    }

    this.running = true;
    this.emit();

    let sentClientes = 0;
    let sentAtendimentos = 0;
    let hadFailure = false;

    try {
      // 1) Sync clientes first so cliente_ids exist on the server
      const pendingClientes = await listPendingClientes();
      for (const c of pendingClientes) {
        try {
          await setClienteStatus(c.localId, 'syncing');
          const { error } = await supabase
            .from('clientes')
            .insert({ id: c.localId, nome: c.nome });
          // Treat duplicate id as success (already synced before)
          if (error && !String(error.message).toLowerCase().includes('duplicate')) {
            throw error;
          }
          await removeCliente(c.localId);
          sentClientes++;
        } catch (err: any) {
          hadFailure = true;
          await setClienteStatus(c.localId, 'failed', err?.message ?? String(err));
        }
      }

      // 2) Sync atendimentos
      const pending = await listPendingAtendimentos();
      for (const item of pending) {
        try {
          await setAtendimentoStatus(item.localId, 'syncing');
          await pushAtendimento(item.localId, item.data);
          await removeAtendimento(item.localId);
          sentAtendimentos++;
        } catch (err: any) {
          hadFailure = true;
          await setAtendimentoStatus(item.localId, 'failed', err?.message ?? String(err));
        }
      }
    } finally {
      this.running = false;
      this.emit();
    }

    if (hadFailure) {
      this.scheduleRetry();
    } else {
      this.retryIndex = 0;
    }

    return { ok: !hadFailure, sentAtendimentos, sentClientes };
  }

  private scheduleRetry() {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = this.retryDelays[Math.min(this.retryIndex, this.retryDelays.length - 1)];
    this.retryIndex++;
    this.retryTimer = setTimeout(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void this.run();
      }
    }, delay);
  }
}

export const syncEngine = new SyncEngine();

async function pushAtendimento(_localId: string, data: AtendimentoData) {
  // Re-hydrate dates if needed
  const dataInicio = data.data_inicio instanceof Date
    ? data.data_inicio
    : new Date(data.data_inicio as unknown as string);
  const dataFim = data.data_fim
    ? (data.data_fim instanceof Date ? data.data_fim : new Date(data.data_fim as unknown as string))
    : new Date();

  const { data: atendimento, error: atendimentoError } = await supabase
    .from('atendimentos')
    .insert({
      responsavel_id: data.responsavel_id || null,
      data_inicio: dataInicio.toISOString(),
      data_fim: dataFim.toISOString(),
      anotacoes: data.anotacoes || null,
      checklist: JSON.parse(JSON.stringify(data.checklist)),
      tipos_atendimento: data.tipos_atendimento,
      acoes_especificas: data.acoes_especificas,
      topicos_reuniao: JSON.parse(JSON.stringify(data.topicos_reuniao)),
      possui_foto_final: data.possui_foto_final,
      finalizado: true,
    })
    .select()
    .single();

  if (atendimentoError) throw atendimentoError;

  if (data.cliente_ids.length > 0) {
    const inserts = data.cliente_ids.map((cliente_id) => ({
      atendimento_id: atendimento.id,
      cliente_id,
    }));
    const { error } = await supabase.from('atendimento_clientes').insert(inserts);
    if (error) throw error;
  }

  for (const foto of data.fotos) {
    if (!foto.url.startsWith('http')) {
      const fileName = `${atendimento.id}/${foto.tipo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const base64Data = foto.url.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/jpeg' });
      const { error: upErr } = await supabase.storage
        .from('atendimento-fotos')
        .upload(fileName, blob);
      if (upErr) throw upErr;
      const { data: publicUrl } = supabase.storage
        .from('atendimento-fotos')
        .getPublicUrl(fileName);
      const { error: insErr } = await supabase.from('atendimento_fotos').insert({
        atendimento_id: atendimento.id,
        foto_url: publicUrl.publicUrl,
        tipo: foto.tipo,
      });
      if (insErr) throw insErr;
    }
  }

  if (data.demandas.length > 0) {
    const rows = data.demandas
      .filter((d) => d.descricao.trim())
      .map((d) => ({
        atendimento_id: atendimento.id,
        tipo_atendimento: d.tipo_atendimento || null,
        descricao: d.descricao,
        plano: d.plano || (d.tipo_atendimento ? getPlanoFromTipo(d.tipo_atendimento) : 'VIP'),
        personalizada: d.personalizada,
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from('demandas').insert(rows);
      if (error) throw error;
    }
  }
}
