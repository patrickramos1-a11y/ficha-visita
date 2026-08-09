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

export type VisitaModo = 'completa' | 'rapida' | 'obras' | 'ambiental' | 'processos';
export type NaturezaVisitaCodigo = 'ATENDIMENTO' | 'OBRAS' | 'AMBIENTAL' | 'PROCESSOS';

export interface AnotacaoVisita {
  id: string;
  texto: string;
  created_at: string;
}

export interface AcompanhamentoProcessosData {
  cliente_id: string;
  cliente_nome?: string;
  cliente_ids: string[];
  orgao_ids: string[];
  processo_ids: string[];
  foto_itens: string[];
}

export type SimNaoParcialNA = 'SIM' | 'NAO' | 'PARCIALMENTE' | 'NAO_SE_APLICA';
export type StatusItemObra = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';
export type AvancoObraFaixa = '0-25%' | '26-50%' | '51-75%' | '76-99%' | 'CONCLUIDA';

export interface PendenciaObra {
  id: string;
  descricao: string;
  responsavel: string;
  prazo: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA';
  status: StatusItemObra;
}

export interface NaoConformidadeObra {
  id: string;
  tipo: string;
  descricao: string;
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA';
  acao_imediata: boolean;
  foto_vinculada: boolean;
  foto_id?: string;
  responsavel: string;
  prazo: string;
  status: StatusItemObra;
}

export interface AcompanhamentoObraData {
  cliente_id: string;
  cliente_nome?: string;
  obra_id?: string;
  obra_nome: string;
  obra_existente: boolean;
  status_geral: string;
  fase_atual: string;
  houve_avanco: SimNaoParcialNA;
  dentro_do_previsto: SimNaoParcialNA;
  percentual_avanco: number;
  percentual_avanco_faixa?: AvancoObraFaixa;
  resumo_semana?: string;
  mudou_desde_visita_anterior?: string;
  pendencias_resolvidas: SimNaoParcialNA;
  controle_ambiental: {
    controle_visivel: SimNaoParcialNA;
    area_delimitada: SimNaoParcialNA;
    interferencia_vegetacao: SimNaoParcialNA;
    supressao_poda: SimNaoParcialNA;
    erosao: SimNaoParcialNA;
    carreamento_sedimentos: SimNaoParcialNA;
    material_inadequado: SimNaoParcialNA;
    intervencao_area_sensivel: SimNaoParcialNA;
    contaminacao_solo: SimNaoParcialNA;
    poeira: SimNaoParcialNA;
    ruido: SimNaoParcialNA;
    odor_emissao: SimNaoParcialNA;
    observacoes?: string;
  };
  organizacao_seguranca: {
    obra_organizada: SimNaoParcialNA;
    materiais_armazenados: SimNaoParcialNA;
    acessos_livres: SimNaoParcialNA;
    sinalizacao_basica: SimNaoParcialNA;
    area_materiais: SimNaoParcialNA;
    area_residuos: SimNaoParcialNA;
    limpeza_geral: SimNaoParcialNA;
    risco_aparente: SimNaoParcialNA;
    uso_epi: SimNaoParcialNA;
    equipe_trabalhando: SimNaoParcialNA;
    responsavel_presente: SimNaoParcialNA;
    condicao_insegura: SimNaoParcialNA;
    orientacao_repassada: SimNaoParcialNA;
    observacoes?: string;
  };
  residuos: {
    ha_residuos: SimNaoParcialNA;
    segregados: SimNaoParcialNA;
    acondicionados: SimNaoParcialNA;
    ha_cacamba: SimNaoParcialNA;
    mistura_residuos: SimNaoParcialNA;
    residuos_espalhados: SimNaoParcialNA;
    residuos_perigosos: SimNaoParcialNA;
    houve_coleta: SimNaoParcialNA;
    comprovante_destinacao: SimNaoParcialNA;
    tipos_observados?: string;
    destinacao_observada?: string;
    responsavel_coleta?: string;
    observacoes?: string;
  };
  efluentes: {
    acumulo_agua: SimNaoParcialNA;
    drenagem_provisoria: SimNaoParcialNA;
    erosao_escoamento: SimNaoParcialNA;
    lancamento_irregular: SimNaoParcialNA;
    lama_via_publica: SimNaoParcialNA;
    protecao_bocas_lobo: SimNaoParcialNA;
    uso_agua: string;
    origem_agua: string;
    banheiro_quimico: SimNaoParcialNA;
    destinacao_efluentes: string;
    vazamento: SimNaoParcialNA;
    odor_extravasamento: SimNaoParcialNA;
    registro_coleta_manutencao: SimNaoParcialNA;
    observacoes?: string;
  };
  nao_conformidades: NaoConformidadeObra[];
  pendencias: PendenciaObra[];
  foto_itens: string[];
}

export interface Obra {
  id: string;
  cliente_id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

export interface AcompanhamentoAmbientalData {
  cliente_id: string;
  cliente_nome?: string;
  atividade?: string;
  motivo_visita: 'FISCALIZACAO' | 'LEVANTAMENTO_PROJETOS' | 'VISITA_TECNICA' | 'REUNIAO';
  politica_ambiental: SimNaoParcialNA;
  coleta_residuos: SimNaoParcialNA;
  dificuldade_coleta?: string;
  gerenciamento_residuos: SimNaoParcialNA;
  uso_lixeiras: SimNaoParcialNA;
  necessidade_palestra?: string;
  documentos_ambientais?: string[];
  ete: {
    possui: SimNaoParcialNA;
    produtos: string[];
    problema_operacao: SimNaoParcialNA;
    novo_operador: SimNaoParcialNA;
    coleta_efluente: SimNaoParcialNA;
    odor: SimNaoParcialNA;
    extravasamento: SimNaoParcialNA;
    manutencao: SimNaoParcialNA;
  };
  agua: {
    leitura_hidrometro: SimNaoParcialNA;
    coleta_poco: SimNaoParcialNA;
    lancamento_regular: SimNaoParcialNA;
    abastecimento_regular: SimNaoParcialNA;
  };
  alteracao_funcionarios: SimNaoParcialNA;
  alteracao_producao: SimNaoParcialNA;
  documento_entregue?: string;
  orientacao_pendencias?: string;
  levantamentos: { nome: string; status: SimNaoParcialNA }[];
  colaborador_nome: string;
  colaborador_cargo?: string;
  observacoes?: string;
  condicoes_operacionais: {
    rotina_adequada: SimNaoParcialNA;
    equipe_presente: SimNaoParcialNA;
    responsavel_presente: SimNaoParcialNA;
    boas_praticas: SimNaoParcialNA;
    risco_aparente: SimNaoParcialNA;
    orientacao_repassada: SimNaoParcialNA;
  };
  nao_conformidades: NaoConformidadeObra[];
  pendencias: PendenciaObra[];
  foto_itens: string[];
}

export interface AtendimentoData {
  sync_id?: string;
  titulo?: string;
  modo?: VisitaModo;
  natureza?: NaturezaVisitaCodigo;
  cliente_ids: string[];
  responsavel_id?: string;
  data_inicio: Date;
  data_fim?: Date;
  anotacoes: string;
  anotacoes_itens: AnotacaoVisita[];
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
  acompanhamento_obra?: AcompanhamentoObraData;
  acompanhamento_ambiental?: AcompanhamentoAmbientalData;
  acompanhamento_processos?: AcompanhamentoProcessosData;
}
