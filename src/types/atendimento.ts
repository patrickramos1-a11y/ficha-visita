export type PlanoTipo = 'VIP' | 'Premium' | 'Master' | 'Integracao';

// Agora dinâmico — gerenciado em Configurações → Tipos
export type AtendimentoTipo = string;

export const PLANOS: PlanoTipo[] = ['VIP', 'Premium', 'Master', 'Integracao'];

export interface ChecklistItem {
  id: string;
  texto: string;
  marcado: boolean;
}

export interface TopicoReuniao {
  numero: number;
  texto: string;
}

export interface Cliente {
  id: string;
  nome: string;
  created_at: string;
}

export interface Responsavel {
  id: string;
  nome: string;
  ativo: boolean;
}

export type DemandaStatus = 'EM_EXECUCAO' | 'CONCLUIDA' | 'NAO_FEITO';

export interface Demanda {
  id?: string;
  tipo_atendimento?: AtendimentoTipo;
  descricao: string;
  plano?: PlanoTipo;
  personalizada: boolean;
  topico_id?: string | null;
  subtopico_id?: string | null;
  status?: DemandaStatus;
}

export type VisitaModo = 'completa' | 'rapida';

export interface AtendimentoData {
  modo?: VisitaModo;
  cliente_ids: string[];
  responsavel_id?: string;
  data_inicio: Date;
  data_fim?: Date;
  anotacoes: string;
  checklist: ChecklistItem[];
  tipos_atendimento: AtendimentoTipo[];
  acoes_especificas: string[];
  topicos_reuniao: TopicoReuniao[];
  fotos: {
    fotoId?: string;
    url: string;
    remoteUrl?: string;
    tipo: 'inicial' | 'durante' | 'final';
  }[];
  demandas: Demanda[];
  possui_foto_final: boolean;
}
