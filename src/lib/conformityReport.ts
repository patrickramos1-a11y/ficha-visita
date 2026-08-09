import type {
  AcompanhamentoAmbientalData,
  AcompanhamentoObraData,
  SimNaoParcialNA,
} from '@/types/atendimento';

export type ConformityAnswer = SimNaoParcialNA;

export interface ConformityItem {
  key: string;
  label: string;
  answer: ConformityAnswer;
}

export interface ConformityCounts {
  conforme: number;
  parcial: number;
  naoConforme: number;
  naoSeAplica: number;
}

export interface ConformityModule {
  id: string;
  title: string;
  items: ConformityItem[];
  counts: ConformityCounts;
  percentage: number | null;
}

export interface ConformityAlert extends ConformityItem {
  moduleTitle: string;
  severity: 'attention' | 'critical';
}

export interface ConformitySummary {
  modules: ConformityModule[];
  counts: ConformityCounts;
  percentage: number | null;
  alerts: ConformityAlert[];
}

type QuestionDefinition = readonly [key: string, label: string];

const WORKS_MODULES: readonly { id: string; title: string; source: string; questions: readonly QuestionDefinition[] }[] = [
  {
    id: 'situacao',
    title: 'Situação da obra',
    source: 'root',
    questions: [
      ['houve_avanco', 'Houve avanço desde a última visita'],
      ['dentro_do_previsto', 'Está dentro do previsto'],
      ['pendencias_resolvidas', 'Pendências anteriores resolvidas'],
    ],
  },
  {
    id: 'controle-ambiental',
    title: 'Controle ambiental',
    source: 'controle_ambiental',
    questions: [
      ['controle_visivel', 'Controle ambiental visível'],
      ['area_delimitada', 'Área delimitada'],
      ['interferencia_vegetacao', 'Interferência em vegetação'],
      ['supressao_poda', 'Supressão ou poda recente'],
      ['erosao', 'Sinais de erosão'],
      ['carreamento_sedimentos', 'Carreamento de sedimentos'],
      ['material_inadequado', 'Material em local inadequado'],
      ['intervencao_area_sensivel', 'Intervenção em APP / área sensível'],
      ['contaminacao_solo', 'Contaminação do solo'],
      ['poeira', 'Poeira'],
      ['ruido', 'Ruído'],
      ['odor_emissao', 'Odor / emissão'],
    ],
  },
  {
    id: 'organizacao-seguranca',
    title: 'Organização e segurança',
    source: 'organizacao_seguranca',
    questions: [
      ['obra_organizada', 'Obra organizada'],
      ['materiais_armazenados', 'Materiais bem armazenados'],
      ['acessos_livres', 'Acessos livres'],
      ['sinalizacao_basica', 'Sinalização básica'],
      ['area_materiais', 'Área para materiais'],
      ['area_residuos', 'Área para resíduos'],
      ['limpeza_geral', 'Limpeza geral'],
      ['risco_aparente', 'Risco aparente'],
      ['uso_epi', 'Uso de EPI'],
      ['equipe_trabalhando', 'Equipe trabalhando'],
      ['responsavel_presente', 'Responsável presente'],
      ['condicao_insegura', 'Condição insegura'],
      ['orientacao_repassada', 'Orientação repassada'],
    ],
  },
  {
    id: 'residuos',
    title: 'Resíduos',
    source: 'residuos',
    questions: [
      ['ha_residuos', 'Há resíduos gerados'],
      ['segregados', 'Resíduos segregados'],
      ['acondicionados', 'Acondicionamento adequado'],
      ['ha_cacamba', 'Caçamba ou local definido'],
      ['mistura_residuos', 'Mistura de resíduos'],
      ['residuos_espalhados', 'Resíduos espalhados'],
      ['residuos_perigosos', 'Resíduos perigosos ou contaminados'],
      ['houve_coleta', 'Coleta desde a última visita'],
      ['comprovante_destinacao', 'Comprovante de destinação'],
    ],
  },
  {
    id: 'agua-drenagem',
    title: 'Água, efluentes e drenagem',
    source: 'efluentes',
    questions: [
      ['acumulo_agua', 'Acúmulo de água'],
      ['drenagem_provisoria', 'Drenagem provisória'],
      ['erosao_escoamento', 'Erosão por escoamento'],
      ['lancamento_irregular', 'Lançamento irregular'],
      ['lama_via_publica', 'Lama na via pública'],
      ['protecao_bocas_lobo', 'Proteção de drenagem'],
      ['banheiro_quimico', 'Estrutura sanitária'],
      ['vazamento', 'Vazamento'],
      ['odor_extravasamento', 'Odor ou extravasamento'],
      ['registro_coleta_manutencao', 'Registro de manutenção'],
    ],
  },
];

const ENVIRONMENTAL_MODULES: readonly { id: string; title: string; source: string; questions: readonly QuestionDefinition[] }[] = [
  {
    id: 'gestao-ambiental',
    title: 'Gestão ambiental e resíduos',
    source: 'root',
    questions: [
      ['politica_ambiental', 'Política ambiental respeitada'],
      ['coleta_residuos', 'Coleta de resíduos organizada'],
      ['gerenciamento_residuos', 'Gerenciamento de resíduos correto'],
      ['uso_lixeiras', 'Lixeiras utilizadas adequadamente'],
      ['alteracao_funcionarios', 'Alteração no quadro de funcionários'],
      ['alteracao_producao', 'Alteração na produção'],
    ],
  },
  {
    id: 'ete-agua',
    title: 'ETE, água e efluentes',
    source: 'ete',
    questions: [
      ['possui', 'Empresa possui ETE'],
      ['problema_operacao', 'Problema na operação da ETE'],
      ['novo_operador', 'Necessidade de treinar operador'],
      ['coleta_efluente', 'Coleta de efluente realizada'],
      ['odor', 'Odor aparente'],
      ['extravasamento', 'Extravasamento aparente'],
      ['manutencao', 'Manutenção ou limpeza registrada'],
    ],
  },
  {
    id: 'agua',
    title: 'Água e abastecimento',
    source: 'agua',
    questions: [
      ['leitura_hidrometro', 'Leitura diária do hidrômetro'],
      ['coleta_poco', 'Coleta de água do poço'],
      ['lancamento_regular', 'Lançamento regular'],
      ['abastecimento_regular', 'Abastecimento regular'],
    ],
  },
  {
    id: 'operacao',
    title: 'Condições operacionais',
    source: 'condicoes_operacionais',
    questions: [
      ['rotina_adequada', 'Rotina operacional adequada'],
      ['equipe_presente', 'Equipe presente'],
      ['responsavel_presente', 'Responsável presente'],
      ['boas_praticas', 'Boas práticas observadas'],
      ['risco_aparente', 'Risco aparente'],
      ['orientacao_repassada', 'Orientação repassada em campo'],
    ],
  },
];

const EMPTY_COUNTS = (): ConformityCounts => ({ conforme: 0, parcial: 0, naoConforme: 0, naoSeAplica: 0 });

export function normalizeConformityAnswer(value: unknown): ConformityAnswer {
  if (value === true) return 'SIM';
  if (value === false) return 'NAO';
  return value === 'SIM' || value === 'PARCIALMENTE' || value === 'NAO' || value === 'NAO_SE_APLICA'
    ? value
    : 'NAO_SE_APLICA';
}

function scoreAnswer(answer: ConformityAnswer) {
  if (answer === 'SIM') return 100;
  if (answer === 'PARCIALMENTE') return 50;
  if (answer === 'NAO') return 0;
  return null;
}

function summarizeModule(id: string, title: string, items: ConformityItem[]): ConformityModule {
  const counts = EMPTY_COUNTS();
  let score = 0;
  let answered = 0;

  items.forEach((item) => {
    const itemScore = scoreAnswer(item.answer);
    if (item.answer === 'SIM') counts.conforme += 1;
    if (item.answer === 'PARCIALMENTE') counts.parcial += 1;
    if (item.answer === 'NAO') counts.naoConforme += 1;
    if (item.answer === 'NAO_SE_APLICA') counts.naoSeAplica += 1;
    if (itemScore !== null) {
      score += itemScore;
      answered += 1;
    }
  });

  return { id, title, items, counts, percentage: answered ? Math.round(score / answered) : null };
}

function makeModules(
  data: Record<string, unknown>,
  definitions: readonly { id: string; title: string; source: string; questions: readonly QuestionDefinition[] }[],
) {
  return definitions.map((definition) => {
    const source = definition.source === 'root'
      ? data
      : ((data[definition.source] as Record<string, unknown> | undefined) ?? {});
    const items = definition.questions.map(([key, label]) => ({
      key,
      label,
      answer: normalizeConformityAnswer(source[key]),
    }));
    return summarizeModule(definition.id, definition.title, items);
  });
}

function makeSummary(modules: ConformityModule[]): ConformitySummary {
  const counts = EMPTY_COUNTS();
  const alerts: ConformityAlert[] = [];
  let score = 0;
  let answered = 0;

  modules.forEach((module) => {
    counts.conforme += module.counts.conforme;
    counts.parcial += module.counts.parcial;
    counts.naoConforme += module.counts.naoConforme;
    counts.naoSeAplica += module.counts.naoSeAplica;

    module.items.forEach((item) => {
      const itemScore = scoreAnswer(item.answer);
      if (itemScore !== null) {
        score += itemScore;
        answered += 1;
      }
      if (item.answer === 'PARCIALMENTE' || item.answer === 'NAO') {
        alerts.push({
          ...item,
          moduleTitle: module.title,
          severity: item.answer === 'NAO' ? 'critical' : 'attention',
        });
      }
    });
  });

  return { modules, counts, percentage: answered ? Math.round(score / answered) : null, alerts };
}

export function buildWorksConformityReport(data: AcompanhamentoObraData | Record<string, unknown>): ConformitySummary {
  return makeSummary(makeModules(data as Record<string, unknown>, WORKS_MODULES));
}

export function buildEnvironmentalConformityReport(data: AcompanhamentoAmbientalData | Record<string, unknown>): ConformitySummary {
  return makeSummary(makeModules(data as Record<string, unknown>, ENVIRONMENTAL_MODULES));
}

export function isConformityVisitMode(modo?: string | null) {
  return modo === 'obras' || modo === 'ambiental';
}

export function visitModeLabel(modo?: string | null) {
  return modo === 'obras' ? 'Acompanhamento de Obras' : 'Acompanhamento Ambiental';
}
