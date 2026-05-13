export type PlanoTipo = 'VIP' | 'Premium' | 'Master' | 'Integracao';

export type AtendimentoTipo = 
  | 'Acompanhamento Ambiental'
  | 'ETE / ETA'
  | 'Tomada de Ciência'
  | 'Consultoria Ambiental'
  | 'Reunião de Alinhamento'
  | 'Planejamento de Ação'
  | 'Implementação de Melhoria'
  | 'Licenciamento Ambiental'
  | 'Fiscalização Ambiental'
  | 'Órgão Ambiental'
  | 'Treinamento Ambiental';

export const TIPOS_ATENDIMENTO: AtendimentoTipo[] = [
  'Acompanhamento Ambiental',
  'ETE / ETA',
  'Tomada de Ciência',
  'Consultoria Ambiental',
  'Reunião de Alinhamento',
  'Planejamento de Ação',
  'Implementação de Melhoria',
  'Licenciamento Ambiental',
  'Fiscalização Ambiental',
  'Órgão Ambiental',
  'Treinamento Ambiental',
];

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

export interface Demanda {
  id?: string;
  tipo_atendimento?: AtendimentoTipo;
  descricao: string;
  plano?: PlanoTipo;
  personalizada: boolean;
}

export interface AtendimentoData {
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
    fotoId?: string; // local IndexedDB blob id (offline-first)
    url: string; // displayable URL: blob:, data: or http(s)
    remoteUrl?: string; // populated after Supabase upload
    tipo: 'inicial' | 'durante' | 'final';
  }[];
  demandas: Demanda[];
  possui_foto_final: boolean;
}
