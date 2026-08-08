import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AtendimentoData, ChecklistItem, AtendimentoTipo, Demanda, TopicoReuniao, PlanoTipo, VisitaModo, AcompanhamentoObraData, AcompanhamentoAmbientalData, NaoConformidadeObra, PendenciaObra } from '@/types/atendimento';
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
  setAcompanhamentoObra: (updater: (prev: AcompanhamentoObraData) => AcompanhamentoObraData) => void;
  setAcompanhamentoAmbiental: (updater: (prev: AcompanhamentoAmbientalData) => AcompanhamentoAmbientalData) => void;
  addNaoConformidade: (item: NaoConformidadeObra) => void;
  updateNaoConformidade: (index: number, item: NaoConformidadeObra) => void;
  removeNaoConformidade: (index: number) => void;
  addPendenciaObra: (item: PendenciaObra) => void;
  updatePendenciaObra: (index: number, item: PendenciaObra) => void;
  removePendenciaObra: (index: number) => void;
  addDemanda: (demanda: Demanda) => void;
  updateDemanda: (index: number, demanda: Demanda) => void;
  removeDemanda: (index: number) => void;
  clearDemandas: () => void;
  finalizarAtendimento: () => void;
  resetAtendimento: () => void;
  iniciarVisita: (modo: VisitaModo) => void;
  gerarSugestoesDemandas: () => Demanda[];
  setRotaAtual: (rota: string) => void;
  getRotaAtual: () => string | null;
}

const initialData: AtendimentoData = {
  modo: 'completa',
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

const initialAcompanhamentoObra: AcompanhamentoObraData = {
  cliente_id: '',
  cliente_nome: '',
  obra_nome: '',
  obra_existente: true,
  status_geral: '',
  fase_atual: '',
  houve_avanco: true,
  dentro_do_previsto: true,
  percentual_avanco: 0,
  resumo_semana: '',
  mudou_desde_visita_anterior: '',
  pendencias_resolvidas: true,
  controle_ambiental: {
    controle_visivel: 'NAO_SE_APLICA',
    area_delimitada: 'NAO_SE_APLICA',
    interferencia_vegetacao: 'NAO_SE_APLICA',
    supressao_poda: 'NAO_SE_APLICA',
    erosao: 'NAO_SE_APLICA',
    carreamento_sedimentos: 'NAO_SE_APLICA',
    material_inadequado: 'NAO_SE_APLICA',
    intervencao_area_sensivel: 'NAO_SE_APLICA',
    contaminacao_solo: 'NAO_SE_APLICA',
    poeira: 'NAO_SE_APLICA',
    ruido: 'NAO_SE_APLICA',
    odor_emissao: 'NAO_SE_APLICA',
    observacoes: '',
  },
  organizacao_seguranca: {
    obra_organizada: 'NAO_SE_APLICA',
    materiais_armazenados: 'NAO_SE_APLICA',
    acessos_livres: 'NAO_SE_APLICA',
    sinalizacao_basica: 'NAO_SE_APLICA',
    area_materiais: 'NAO_SE_APLICA',
    area_residuos: 'NAO_SE_APLICA',
    limpeza_geral: 'NAO_SE_APLICA',
    risco_aparente: 'NAO_SE_APLICA',
    uso_epi: 'NAO_SE_APLICA',
    equipe_trabalhando: 'NAO_SE_APLICA',
    responsavel_presente: 'NAO_SE_APLICA',
    condicao_insegura: 'NAO_SE_APLICA',
    orientacao_repassada: 'NAO_SE_APLICA',
    observacoes: '',
  },
  residuos: {
    ha_residuos: 'NAO_SE_APLICA',
    segregados: 'NAO_SE_APLICA',
    acondicionados: 'NAO_SE_APLICA',
    ha_cacamba: 'NAO_SE_APLICA',
    mistura_residuos: 'NAO_SE_APLICA',
    residuos_espalhados: 'NAO_SE_APLICA',
    residuos_perigosos: 'NAO_SE_APLICA',
    houve_coleta: 'NAO_SE_APLICA',
    comprovante_destinacao: 'NAO_SE_APLICA',
    tipos_observados: '',
    destinacao_observada: '',
    responsavel_coleta: '',
    observacoes: '',
  },
  efluentes: {
    acumulo_agua: 'NAO_SE_APLICA',
    drenagem_provisoria: 'NAO_SE_APLICA',
    erosao_escoamento: 'NAO_SE_APLICA',
    lancamento_irregular: 'NAO_SE_APLICA',
    lama_via_publica: 'NAO_SE_APLICA',
    protecao_bocas_lobo: 'NAO_SE_APLICA',
    uso_agua: '',
    origem_agua: '',
    banheiro_quimico: 'NAO_SE_APLICA',
    destinacao_efluentes: '',
    vazamento: 'NAO_SE_APLICA',
    odor_extravasamento: 'NAO_SE_APLICA',
    registro_coleta_manutencao: 'NAO_SE_APLICA',
    observacoes: '',
  },
  nao_conformidades: [],
  pendencias: [],
  foto_itens: [],
};

const initialAcompanhamentoAmbiental: AcompanhamentoAmbientalData = {
  cliente_id: '', cliente_nome: '', atividade: '', motivo_visita: 'VISITA_TECNICA',
  politica_ambiental: 'NAO_SE_APLICA', coleta_residuos: 'NAO_SE_APLICA', dificuldade_coleta: '',
  gerenciamento_residuos: 'NAO_SE_APLICA', uso_lixeiras: 'NAO_SE_APLICA', necessidade_palestra: '',
  documentos_ambientais: [],
  ete: { possui: 'NAO_SE_APLICA', produtos: [], problema_operacao: 'NAO_SE_APLICA', novo_operador: 'NAO_SE_APLICA', coleta_efluente: 'NAO_SE_APLICA' },
  agua: { leitura_hidrometro: 'NAO_SE_APLICA', coleta_poco: 'NAO_SE_APLICA' },
  alteracao_funcionarios: 'NAO_SE_APLICA', alteracao_producao: 'NAO_SE_APLICA', documento_entregue: '', orientacao_pendencias: '',
  levantamentos: ['Fotos da empresa', 'Fotos da ETE', 'Fotos do poço', 'Fotos do reservatório', 'Cópias da documentação'].map(nome => ({ nome, status: 'NAO_SE_APLICA' })),
  colaborador_nome: '', colaborador_cargo: '', observacoes: '',
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
    // Strip transient blob: URLs (they are recreated on load from fotoId)
    const safe: AtendimentoData = {
      ...data,
      fotos: data.fotos.map(f => ({
        ...f,
        url: f.url?.startsWith('blob:') ? '' : f.url,
      })),
    };
    const state: PersistedState = { data: safe, ativo };
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

  // After mount, regenerate object URLs for any persisted photos that lost their URL
  useEffect(() => {
    const needsRehydrate = data.fotos.some(f => f.fotoId && (!f.url || f.url.startsWith('blob:') === false && f.url === ''));
    if (!needsRehydrate) return;
    let cancelled = false;
    (async () => {
      const rehydrated = await Promise.all(
        data.fotos.map(async (f) => {
          if (f.fotoId && (!f.url || f.url === '')) {
            const url = await getPhotoObjectURL(f.fotoId);
            return url ? { ...f, url } : null;
          }
          return f;
        }),
      );
      if (cancelled) return;
      const cleaned = rehydrated.filter(Boolean) as typeof data.fotos;
      setData(prev => ({ ...prev, fotos: cleaned }));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const setAcompanhamentoObra = (updater: (prev: AcompanhamentoObraData) => AcompanhamentoObraData) => {
    setData(prev => {
      const acompanhamento_obra = updater(prev.acompanhamento_obra ?? { ...initialAcompanhamentoObra });
      return { ...prev, acompanhamento_obra, cliente_ids: acompanhamento_obra.cliente_id ? [...new Set([...prev.cliente_ids, acompanhamento_obra.cliente_id])] : prev.cliente_ids };
    });
  };

  const setAcompanhamentoAmbiental = (updater: (prev: AcompanhamentoAmbientalData) => AcompanhamentoAmbientalData) => {
    setData(prev => {
      const acompanhamento_ambiental = updater(prev.acompanhamento_ambiental ?? { ...initialAcompanhamentoAmbiental });
      return { ...prev, acompanhamento_ambiental, cliente_ids: acompanhamento_ambiental.cliente_id ? [...new Set([...prev.cliente_ids, acompanhamento_ambiental.cliente_id])] : prev.cliente_ids };
    });
  };

  const addNaoConformidade = (item: NaoConformidadeObra) => {
    setAcompanhamentoObra(prev => ({ ...prev, nao_conformidades: [...prev.nao_conformidades, item] }));
  };

  const updateNaoConformidade = (index: number, item: NaoConformidadeObra) => {
    setAcompanhamentoObra(prev => ({
      ...prev,
      nao_conformidades: prev.nao_conformidades.map((n, i) => (i === index ? item : n)),
    }));
  };

  const removeNaoConformidade = (index: number) => {
    setAcompanhamentoObra(prev => ({
      ...prev,
      nao_conformidades: prev.nao_conformidades.filter((_, i) => i !== index),
    }));
  };

  const addPendenciaObra = (item: PendenciaObra) => {
    setAcompanhamentoObra(prev => ({ ...prev, pendencias: [...prev.pendencias, item] }));
  };

  const updatePendenciaObra = (index: number, item: PendenciaObra) => {
    setAcompanhamentoObra(prev => ({
      ...prev,
      pendencias: prev.pendencias.map((p, i) => (i === index ? item : p)),
    }));
  };

  const removePendenciaObra = (index: number) => {
    setAcompanhamentoObra(prev => ({
      ...prev,
      pendencias: prev.pendencias.filter((_, i) => i !== index),
    }));
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

  const iniciarVisita = useCallback((modo: VisitaModo) => {
    clearStorage();
    setData({
      ...initialData,
      modo,
      data_inicio: new Date(),
      acompanhamento_obra: modo === 'obras' ? { ...initialAcompanhamentoObra } : undefined,
      acompanhamento_ambiental: modo === 'ambiental' ? { ...initialAcompanhamentoAmbiental } : undefined,
    });
    setAtivo(true);
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
        addFotoFile,
        removeFoto,
        setTiposAtendimento,
        setAcoesEspecificas,
        setAcompanhamentoObra,
        setAcompanhamentoAmbiental,
        addNaoConformidade,
        updateNaoConformidade,
        removeNaoConformidade,
        addPendenciaObra,
        updatePendenciaObra,
        removePendenciaObra,
        addDemanda,
        updateDemanda,
        removeDemanda,
        clearDemandas,
        finalizarAtendimento,
        resetAtendimento,
        iniciarVisita,
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
