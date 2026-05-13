import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AtendimentoData, ChecklistItem, AtendimentoTipo, Demanda, TopicoReuniao, PlanoTipo } from '@/types/atendimento';
import { getPlanoFromTipo, getPlanoFromAcao } from '@/types/tiposAtendimentoConfig';
import { savePhotoBlob, deletePhoto, getPhotoObjectURL } from '@/lib/offlineDB';

const STORAGE_KEY = 'atendimento-em-andamento';
const ROUTE_KEY = 'atendimento-rota-atual';

interface PersistedState {
  data: AtendimentoData;
  ativo: boolean;
}

interface AtendimentoContextType {
  data: AtendimentoData;
  ativo: boolean;
  setClienteIds: (ids: string[]) => void;
  addClienteId: (id: string) => void;
  removeClienteId: (id: string) => void;
  setResponsavelId: (id: string) => void;
  setAnotacoes: (texto: string) => void;
  addChecklistItem: (texto: string) => void;
  toggleChecklistItem: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  addFoto: (url: string, tipo: 'inicial' | 'durante' | 'final') => void;
  addFotoFile: (file: File | Blob, tipo: 'inicial' | 'durante' | 'final') => Promise<void>;
  removeFoto: (url: string) => void;
  setTiposAtendimento: (tipos: AtendimentoTipo[]) => void;
  setAcoesEspecificas: (acoes: string[]) => void;
  addDemanda: (demanda: Demanda) => void;
  updateDemanda: (index: number, demanda: Demanda) => void;
  removeDemanda: (index: number) => void;
  clearDemandas: () => void;
  finalizarAtendimento: () => void;
  resetAtendimento: () => void;
  gerarSugestoesDemandas: () => Demanda[];
  setRotaAtual: (rota: string) => void;
  getRotaAtual: () => string | null;
}

const initialData: AtendimentoData = {
  cliente_ids: [],
  data_inicio: new Date(),
  anotacoes: '',
  checklist: [],
  tipos_atendimento: [],
  acoes_especificas: [],
  topicos_reuniao: [],
  fotos: [],
  demandas: [],
  possui_foto_final: false,
};

function loadFromStorage(): { data: AtendimentoData; ativo: boolean } | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PersistedState;
    if (!parsed.ativo) return null;
    // Deserialize dates
    parsed.data.data_inicio = new Date(parsed.data.data_inicio);
    if (parsed.data.data_fim) parsed.data.data_fim = new Date(parsed.data.data_fim);
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(data: AtendimentoData, ativo: boolean) {
  try {
    const state: PersistedState = { data, ativo };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to persist visit data:', e);
  }
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ROUTE_KEY);
}

const AtendimentoContext = createContext<AtendimentoContextType | undefined>(undefined);

export function AtendimentoProvider({ children }: { children: ReactNode }) {
  const [ativo, setAtivo] = useState(() => {
    const stored = loadFromStorage();
    return stored?.ativo ?? false;
  });

  const [data, setData] = useState<AtendimentoData>(() => {
    const stored = loadFromStorage();
    return stored?.data ?? { ...initialData, data_inicio: new Date() };
  });

  // Persist to localStorage on every change
  useEffect(() => {
    if (ativo) {
      saveToStorage(data, ativo);
    }
  }, [data, ativo]);

  const setClienteIds = (ids: string[]) => {
    setData(prev => ({ ...prev, cliente_ids: ids }));
  };

  const addClienteId = (id: string) => {
    setData(prev => ({
      ...prev,
      cliente_ids: prev.cliente_ids.includes(id) ? prev.cliente_ids : [...prev.cliente_ids, id]
    }));
  };

  const removeClienteId = (id: string) => {
    setData(prev => ({
      ...prev,
      cliente_ids: prev.cliente_ids.filter(cid => cid !== id)
    }));
  };

  const setResponsavelId = (id: string) => {
    setData(prev => ({ ...prev, responsavel_id: id }));
  };

  const setAnotacoes = (texto: string) => {
    setData(prev => ({ ...prev, anotacoes: texto }));
  };

  const addChecklistItem = (texto: string) => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      texto,
      marcado: false,
    };
    setData(prev => ({ ...prev, checklist: [...prev.checklist, newItem] }));
  };

  const toggleChecklistItem = (id: string) => {
    setData(prev => ({
      ...prev,
      checklist: prev.checklist.map(item =>
        item.id === id ? { ...item, marcado: !item.marcado } : item
      ),
    }));
  };

  const removeChecklistItem = (id: string) => {
    setData(prev => ({
      ...prev,
      checklist: prev.checklist.filter(item => item.id !== id),
    }));
  };

  const addFoto = (url: string, tipo: 'inicial' | 'durante' | 'final') => {
    setData(prev => {
      const newFotos = [...prev.fotos, { url, tipo }];
      const possuiFotoFinal = newFotos.some(f => f.tipo === 'final');
      return { ...prev, fotos: newFotos, possui_foto_final: possuiFotoFinal };
    });
  };

  const addFotoFile = async (file: File | Blob, tipo: 'inicial' | 'durante' | 'final') => {
    const { fotoId, objectUrl } = await savePhotoBlob(file, tipo);
    setData(prev => {
      const newFotos = [...prev.fotos, { fotoId, url: objectUrl, tipo }];
      const possuiFotoFinal = newFotos.some(f => f.tipo === 'final');
      return { ...prev, fotos: newFotos, possui_foto_final: possuiFotoFinal };
    });
  };

  const removeFoto = (url: string) => {
    setData(prev => {
      const target = prev.fotos.find(f => f.url === url);
      if (target?.fotoId) void deletePhoto(target.fotoId);
      if (target?.url?.startsWith('blob:')) {
        try { URL.revokeObjectURL(target.url); } catch { /* noop */ }
      }
      const newFotos = prev.fotos.filter(f => f.url !== url);
      const possuiFotoFinal = newFotos.some(f => f.tipo === 'final');
      return { ...prev, fotos: newFotos, possui_foto_final: possuiFotoFinal };
    });
  };

  const setTiposAtendimento = (tipos: AtendimentoTipo[]) => {
    setData(prev => ({ ...prev, tipos_atendimento: tipos }));
  };

  const setAcoesEspecificas = (acoes: string[]) => {
    setData(prev => ({ ...prev, acoes_especificas: acoes }));
  };

  const addDemanda = (demanda: Demanda) => {
    setData(prev => ({ ...prev, demandas: [...prev.demandas, demanda] }));
  };

  const updateDemanda = (index: number, demanda: Demanda) => {
    setData(prev => ({
      ...prev,
      demandas: prev.demandas.map((d, i) => (i === index ? demanda : d)),
    }));
  };

  const removeDemanda = (index: number) => {
    setData(prev => ({
      ...prev,
      demandas: prev.demandas.filter((_, i) => i !== index),
    }));
  };

  const clearDemandas = () => {
    setData(prev => ({ ...prev, demandas: [] }));
  };

  const finalizarAtendimento = () => {
    setData(prev => ({ ...prev, data_fim: new Date() }));
  };

  const resetAtendimento = useCallback(() => {
    clearStorage();
    setAtivo(false);
    setData({ ...initialData, data_inicio: new Date() });
  }, []);

  const gerarSugestoesDemandas = (): Demanda[] => {
    const sugestoes: Demanda[] = [];
    data.checklist
      .filter(item => !item.marcado && item.texto.trim())
      .forEach(item => {
        sugestoes.push({
          descricao: item.texto,
          plano: 'VIP',
          personalizada: false,
        });
      });
    return sugestoes;
  };

  const setRotaAtual = useCallback((rota: string) => {
    try {
      localStorage.setItem(ROUTE_KEY, rota);
      // Also mark as active when navigating to a visit page
      if (!ativo) {
        setAtivo(true);
      }
    } catch (e) {
      console.warn('Failed to persist route:', e);
    }
  }, [ativo]);

  const getRotaAtual = useCallback((): string | null => {
    try {
      return localStorage.getItem(ROUTE_KEY);
    } catch {
      return null;
    }
  }, []);

  return (
    <AtendimentoContext.Provider
      value={{
        data,
        ativo,
        setClienteIds,
        addClienteId,
        removeClienteId,
        setResponsavelId,
        setAnotacoes,
        addChecklistItem,
        toggleChecklistItem,
        removeChecklistItem,
        addFoto,
        removeFoto,
        setTiposAtendimento,
        setAcoesEspecificas,
        addDemanda,
        updateDemanda,
        removeDemanda,
        clearDemandas,
        finalizarAtendimento,
        resetAtendimento,
        gerarSugestoesDemandas,
        setRotaAtual,
        getRotaAtual,
      }}
    >
      {children}
    </AtendimentoContext.Provider>
  );
}

export function useAtendimento() {
  const context = useContext(AtendimentoContext);
  if (!context) {
    throw new Error('useAtendimento must be used within AtendimentoProvider');
  }
  return context;
}
