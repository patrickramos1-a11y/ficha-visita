import { PlanoTipo } from './atendimento';

export interface TipoAtendimentoConfig {
  nome: string;
  descricao: string;
  plano: PlanoTipo;
}

export const TIPOS_ATENDIMENTO_CONFIG: TipoAtendimentoConfig[] = [
  {
    nome: 'Acompanhamento Ambiental',
    descricao: 'Verificação de conformidades ambientais e acompanhamento das rotinas do empreendimento.',
    plano: 'VIP'
  },
  {
    nome: 'ETE / ETA',
    descricao: 'Avaliação do funcionamento da estação de tratamento e identificação de necessidades de ajuste.',
    plano: 'Premium'
  },
  {
    nome: 'Tomada de Ciência',
    descricao: 'Análise inicial de problema ou demanda apresentada pelo cliente.',
    plano: 'VIP'
  },
  {
    nome: 'Consultoria Ambiental',
    descricao: 'Orientação técnica ambiental e esclarecimento de dúvidas do cliente.',
    plano: 'VIP'
  },
  {
    nome: 'Reunião de Alinhamento',
    descricao: 'Alinhamento de demandas, escopo e próximos passos.',
    plano: 'VIP'
  },
  {
    nome: 'Planejamento de Ação',
    descricao: 'Definição de soluções e priorização de ações ambientais.',
    plano: 'Premium'
  },
  {
    nome: 'Implementação de Melhoria',
    descricao: 'Acompanhamento da execução de melhorias ambientais.',
    plano: 'Master'
  },
  {
    nome: 'Licenciamento Ambiental',
    descricao: 'Acompanhamento de processo de licenciamento e vistoria técnica.',
    plano: 'VIP'
  },
  {
    nome: 'Fiscalização Ambiental',
    descricao: 'Acompanhamento de fiscalização ambiental e análise de exigências.',
    plano: 'VIP'
  },
  {
    nome: 'Órgão Ambiental',
    descricao: 'Protocolo, reunião ou acompanhamento de processo junto ao órgão ambiental.',
    plano: 'VIP'
  },
  {
    nome: 'Treinamento Ambiental',
    descricao: 'Capacitação ambiental e orientação de procedimentos.',
    plano: 'Premium'
  },
];

export interface AcaoEspecificaConfig {
  nome: string;
  plano: PlanoTipo;
}

// Ações de obra/estrutura são Premium, demais são VIP
export const ACOES_ESPECIFICAS_CONFIG: AcaoEspecificaConfig[] = [
  { nome: 'Acompanhar obra da ETE', plano: 'Premium' },
  { nome: 'Acom. obra da fábrica', plano: 'Premium' },
  { nome: 'Ac. reforma da estação', plano: 'Premium' },
  { nome: 'Ac. ampliação de sistema', plano: 'Premium' },
  { nome: 'Verificar estrutura física da ETE', plano: 'Premium' },
  { nome: 'Verificar operação em campo', plano: 'VIP' },
  { nome: 'Atuar em área externa', plano: 'VIP' },
  { nome: 'Atuar em área de resíduos', plano: 'VIP' },
  { nome: 'Atuar em área de efluentes', plano: 'VIP' },
  { nome: 'Atuar em frente documental', plano: 'VIP' },
];

export function getPlanoFromTipo(tipo: string): PlanoTipo | undefined {
  const config = TIPOS_ATENDIMENTO_CONFIG.find(t => t.nome === tipo);
  return config?.plano;
}

export function getPlanoFromAcao(acao: string): PlanoTipo {
  const config = ACOES_ESPECIFICAS_CONFIG.find(a => a.nome === acao);
  return config?.plano || 'VIP';
}
