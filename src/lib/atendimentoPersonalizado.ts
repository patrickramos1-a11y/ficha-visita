import type {
  AtendimentoPersonalizadoData,
  AtendimentoPersonalizadoItem,
  AtendimentoPersonalizadoModulo,
  AtendimentoPersonalizadoResposta,
  RespostaConformidadePersonalizada,
} from '@/types/atendimento';

export type PersonalizadoCounts = {
  conforme: number;
  parcial: number;
  naoConforme: number;
  naoSeAplica: number;
  registros: number;
};

export type PersonalizadoModuleSummary = {
  id: string;
  title: string;
  percentage: number | null;
  counts: PersonalizadoCounts;
  items: Array<{
    id: string;
    label: string;
    response: RespostaConformidadePersonalizada;
    observation?: string;
    requiresPhoto?: boolean;
    hasPhoto?: boolean;
    responseLabel?: string;
    tipoResposta?: string;
  }>;
};

export type PersonalizadoAlert = {
  key: string;
  moduleTitle: string;
  label: string;
  severity: 'attention' | 'critical';
};

export type PersonalizadoReport = {
  percentage: number | null;
  counts: PersonalizadoCounts;
  modules: PersonalizadoModuleSummary[];
  alerts: PersonalizadoAlert[];
};

const PCA_POSTO_AV_BRASIL = 'Inspeção PCA - Posto Av. Brasil';

const PCA_DISABLED_MODULES = new Set([
  'Recebimento e abastecimento',
  'Educação ambiental',
  'Resultado geral da inspeção',
  'Ações necessárias',
  'Registro de intervenção',
  'Encerramento da ficha',
]);

const PCA_DISABLED_ITEMS = new Set([
  'Data da última inspeção foi verificada quando aplicável.',
  'Existência de resíduo contaminado armazenado está controlada.',
  'Quantidade acumulada não indica necessidade imediata de coleta.',
  'Câmaras de contenção em condição aparente adequada.',
  'Sistema de monitoramento intersticial sem indicação de anormalidade.',
]);

const TYPE_MODULE_MATCHES: Array<[string, string[]]> = [
  ['inspecao pca', ['identificacao da inspecao']],
  ['controle ambiental operacional', ['identificacao da inspecao', 'emissoes ruidos e condicoes operacionais']],
  ['gerenciamento de residuos', ['gerenciamento de residuos']],
  ['sistema sanitario', ['sistema sanitario']],
  ['drenagem pluvial', ['drenagem pluvial']],
  ['sao drenagem oleosa', ['drenagem oleosa e sao']],
  ['protecao do solo', ['protecao do solo e sistema de combustiveis']],
  ['sistema de combustiveis', ['protecao do solo e sistema de combustiveis']],
  ['condicoes operacionais', ['emissoes ruidos e condicoes operacionais']],
];

const ACTION_MODULE_MATCHES: Array<[string, string[]]> = [
  ['residuos comuns', ['gerenciamento de residuos']],
  ['residuos contaminados', ['gerenciamento de residuos']],
  ['fossa septica', ['sistema sanitario']],
  ['filtro anaerobio', ['sistema sanitario']],
  ['sumidouro', ['sistema sanitario']],
  ['drenagem pluvial', ['drenagem pluvial']],
  ['canaletas', ['drenagem oleosa e sao']],
  ['caixas de inspecao', ['drenagem oleosa e sao']],
  ['avaliar sao', ['drenagem oleosa e sao']],
  ['presenca de oleo', ['drenagem oleosa e sao']],
  ['sedimentos', ['drenagem oleosa e sao']],
  ['necessidade de limpeza', ['drenagem oleosa e sao', 'sistema sanitario', 'drenagem pluvial']],
  ['piso da pista', ['protecao do solo e sistema de combustiveis']],
  ['sinais de vazamento', ['protecao do solo e sistema de combustiveis']],
  ['bombas e mangueiras', ['protecao do solo e sistema de combustiveis']],
  ['respiros', ['emissoes ruidos e condicoes operacionais']],
  ['odor ou ruido', ['emissoes ruidos e condicoes operacionais']],
];

const emptyCounts = (): PersonalizadoCounts => ({
  conforme: 0,
  parcial: 0,
  naoConforme: 0,
  naoSeAplica: 0,
  registros: 0,
});

function addCounts(target: PersonalizadoCounts, source: PersonalizadoCounts) {
  target.conforme += source.conforme;
  target.parcial += source.parcial;
  target.naoConforme += source.naoConforme;
  target.naoSeAplica += source.naoSeAplica;
  target.registros += source.registros;
}

function normalizeConformityResponse(response: RespostaConformidadePersonalizada) {
  if (response === 'CONFORME' || response === 'ADEQUADO') return 'ADEQUADO';
  if (response === 'PARCIAL' || response === 'REQUER_ATENCAO') return 'REQUER_ATENCAO';
  if (response === 'NAO_CONFORME') return 'NAO_CONFORME';
  if (response === 'NAO_SE_APLICA') return 'NAO_SE_APLICA';
  return response;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function shouldIncludePersonalizadoModule(data: AtendimentoPersonalizadoData | null | undefined, module: AtendimentoPersonalizadoModulo) {
  if (module.ativo === false) return false;
  return data?.atendimento_personalizado_nome !== PCA_POSTO_AV_BRASIL || !PCA_DISABLED_MODULES.has(module.titulo);
}

export function shouldIncludePersonalizadoItem(data: AtendimentoPersonalizadoData | null | undefined, item: AtendimentoPersonalizadoItem) {
  if (item.ativo === false) return false;
  return data?.atendimento_personalizado_nome !== PCA_POSTO_AV_BRASIL || !PCA_DISABLED_ITEMS.has(item.texto);
}

export function formatPersonalizadoQuestion(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.endsWith('?')) return trimmed;
  return `${trimmed.replace(/[.!:;]+$/, '')}?`;
}

export function canonicalPersonalizadoResponse(
  item: AtendimentoPersonalizadoItem,
  response: RespostaConformidadePersonalizada,
): RespostaConformidadePersonalizada {
  const normalized = normalizeConformityResponse(response);
  if (['ADEQUADO', 'REQUER_ATENCAO', 'NAO_CONFORME', 'NAO_SE_APLICA'].includes(normalized)) return normalized;

  if (item.tipo_resposta === 'SIM_NAO_EVENTO' && (response === 'SIM' || response === 'NAO')) {
    return response === (item.resposta_positiva || 'NAO') ? 'ADEQUADO' : 'NAO_CONFORME';
  }
  if (item.tipo_resposta === 'NECESSIDADE_ACAO') {
    if (response === 'NAO_NECESSARIA') return 'ADEQUADO';
    if (response === 'AVALIAR') return 'REQUER_ATENCAO';
    if (response === 'NECESSARIA') return 'NAO_CONFORME';
  }
  return response;
}

function responseLabel(response: RespostaConformidadePersonalizada) {
  const labels: Record<string, string> = {
    CONFORME: 'Sim',
    ADEQUADO: 'Sim',
    PARCIAL: 'Atenção',
    REQUER_ATENCAO: 'Atenção',
    NAO_CONFORME: 'Não',
    NAO_SE_APLICA: 'N/A',
    SIM: 'Sim',
    NAO: 'Não',
    NAO_NECESSARIA: 'Não necessária',
    AVALIAR: 'Avaliar',
    NECESSARIA: 'Necessária',
    REGISTRO: 'Registro',
  };
  return response ? labels[response] ?? response.replaceAll('_', ' ') : 'Sem resposta';
}

function evaluateResponse(item: AtendimentoPersonalizadoItem, response: RespostaConformidadePersonalizada) {
  const tipo = item.tipo_resposta || 'CONFORMIDADE';
  if (!response) return { score: null as number | null, bucket: null as keyof PersonalizadoCounts | null };
  if (response === 'NAO_SE_APLICA') return { score: null, bucket: 'naoSeAplica' as const };
  if (tipo === 'REGISTRO' || item.entra_conformidade === false) {
    return { score: null, bucket: response || item.permite_observacao ? 'registros' as const : null };
  }

  const canonical = canonicalPersonalizadoResponse(item, response);
  if (canonical === 'ADEQUADO') return { score: 100, bucket: 'conforme' as const };
  if (canonical === 'REQUER_ATENCAO') return { score: 50, bucket: 'parcial' as const };
  if (canonical === 'NAO_CONFORME') return { score: 0, bucket: 'naoConforme' as const };

  if (tipo === 'SIM_NAO_EVENTO') {
    const positive = item.resposta_positiva || 'NAO';
    return response === positive
      ? { score: 100, bucket: 'conforme' as const }
      : { score: 0, bucket: 'naoConforme' as const };
  }

  if (tipo === 'NECESSIDADE_ACAO') {
    if (response === 'NAO_NECESSARIA') return { score: 100, bucket: 'conforme' as const };
    if (response === 'AVALIAR') return { score: 50, bucket: 'parcial' as const };
    if (response === 'NECESSARIA') return { score: 0, bucket: 'naoConforme' as const };
  }

  const normalized = normalizeConformityResponse(response);
  if (normalized === 'ADEQUADO') return { score: 100, bucket: 'conforme' as const };
  if (normalized === 'REQUER_ATENCAO') return { score: 50, bucket: 'parcial' as const };
  if (normalized === 'NAO_CONFORME') return { score: 0, bucket: 'naoConforme' as const };
  return { score: null, bucket: null };
}

function isAttentionResponse(item: AtendimentoPersonalizadoItem, response: RespostaConformidadePersonalizada) {
  const result = evaluateResponse(item, response);
  return result.bucket === 'parcial' || result.bucket === 'naoConforme';
}

function alertSeverity(item: AtendimentoPersonalizadoItem, response: RespostaConformidadePersonalizada): 'attention' | 'critical' {
  const criticality = String(item.criticidade ?? '').toLowerCase();
  const result = evaluateResponse(item, response);
  if (result.bucket === 'naoConforme' || criticality === 'alta' || criticality === 'critica') return 'critical';
  return 'attention';
}

function percentageFromScores(scores: number[]) {
  if (!scores.length) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

export function buildPersonalizadoConformityReport(
  data?: AtendimentoPersonalizadoData | null,
  photos: Array<{ atendimento_personalizado_item_id?: string | null; atendimento_personalizado_item_ids?: string[] | null }> = [],
): PersonalizadoReport | null {
  if (!data) return null;

  const responseByItem = new Map<string, AtendimentoPersonalizadoResposta>();
  for (const response of data.respostas ?? []) responseByItem.set(response.item_id, response);

  const photoItemIds = new Set<string>();
  for (const photo of photos) {
    if (photo.atendimento_personalizado_item_id) photoItemIds.add(photo.atendimento_personalizado_item_id);
    for (const itemId of photo.atendimento_personalizado_item_ids ?? []) {
      if (itemId) photoItemIds.add(itemId);
    }
  }
  const totalCounts = emptyCounts();
  const totalScores: number[] = [];
  const alerts: PersonalizadoAlert[] = [];

  const modules = (data.modulos ?? [])
    .filter((module) => shouldIncludePersonalizadoModule(data, module))
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((module: AtendimentoPersonalizadoModulo) => {
      const counts = emptyCounts();
      const scores: number[] = [];
      const items = (module.itens ?? [])
        .filter((item) => shouldIncludePersonalizadoItem(data, item))
        .filter((item) => {
          if (!item.condicional_item_id || !item.condicional_resposta) return true;
          return responseByItem.get(item.condicional_item_id)?.resposta === item.condicional_resposta;
        })
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => {
          const saved = responseByItem.get(item.id);
          const response = (saved?.resposta || '') as RespostaConformidadePersonalizada;
          const hasPhoto = photoItemIds.has(item.id);
          const evaluation = evaluateResponse(item, response);

          if (evaluation.bucket) counts[evaluation.bucket] += 1;
          if (evaluation.score !== null && module.entra_conformidade !== false) scores.push(evaluation.score);

          if (response && response !== 'NAO_SE_APLICA' && isAttentionResponse(item, response)) {
            alerts.push({ key: item.id, moduleTitle: module.titulo, label: item.texto, severity: alertSeverity(item, response) });
          }

          if (item.exige_foto && !hasPhoto) {
            alerts.push({
              key: `${item.id}-foto`,
              moduleTitle: module.titulo,
              label: `Foto obrigatória ausente: ${item.texto}`,
              severity: 'attention',
            });
          }

          return {
            id: item.id,
            label: item.texto,
            response,
            observation: saved?.observacao,
            requiresPhoto: item.exige_foto,
            hasPhoto,
            responseLabel: responseLabel(response),
            tipoResposta: item.tipo_resposta,
          };
        });

      addCounts(totalCounts, counts);
      totalScores.push(...scores);

      return {
        id: module.id,
        title: module.titulo,
        percentage: percentageFromScores(scores),
        counts,
        items,
      };
    });

  return {
    percentage: percentageFromScores(totalScores),
    counts: totalCounts,
    modules,
    alerts,
  };
}

export function derivePersonalizadoActivitySelections(data?: AtendimentoPersonalizadoData | null) {
  if (!data) return { tipos: [] as string[], acoes: [] as string[] };

  const responseByItem = new Map((data.respostas ?? []).map((response) => [response.item_id, response]));
  const completedModules = (data.modulos ?? [])
    .filter((module) => shouldIncludePersonalizadoModule(data, module))
    .filter((module) => {
      const items = (module.itens ?? [])
        .filter((item) => shouldIncludePersonalizadoItem(data, item))
        .filter((item) => {
          if (!item.condicional_item_id || !item.condicional_resposta) return true;
          return responseByItem.get(item.condicional_item_id)?.resposta === item.condicional_resposta;
        });
      return items.length > 0 && items.every((item) => {
        const saved = responseByItem.get(item.id);
        return item.tipo_resposta === 'REGISTRO'
          ? Boolean(saved?.observacao?.trim())
          : Boolean(saved?.resposta);
      });
    });

  const completedTitles = new Set(completedModules.map((module) => normalizeText(module.titulo)));
  const matchesCompletedModule = (targets: string[]) => targets.some((target) => completedTitles.has(target));

  const tipos = (data.tipos ?? [])
    .filter((item) => item.ativo !== false)
    .filter((item) => {
      const name = normalizeText(item.nome);
      const configured = TYPE_MODULE_MATCHES.find(([matcher]) => name.includes(matcher));
      if (configured) return matchesCompletedModule(configured[1]);
      return [...completedTitles].some((title) => title.includes(name) || name.includes(title));
    })
    .map((item) => item.nome);

  const acoes = (data.acoes ?? [])
    .filter((item) => item.ativo !== false)
    .filter((item) => {
      const name = normalizeText(item.nome).replace(/^(verificar|inspecionar|avaliar|registrar) /, '');
      const configured = ACTION_MODULE_MATCHES.find(([matcher]) => name.includes(matcher) || matcher.includes(name));
      if (configured) return matchesCompletedModule(configured[1]);
      return completedModules.some((module) => {
        const corpus = normalizeText(`${module.titulo} ${(module.itens ?? []).map((entry) => entry.texto).join(' ')}`);
        return name.split(' ').filter((token) => token.length > 4).some((token) => corpus.includes(token));
      });
    })
    .map((item) => item.nome);

  return { tipos, acoes };
}

export function serializePersonalizadoModuleSummary(report: PersonalizadoReport | null) {
  if (!report) return {};
  return Object.fromEntries(report.modules.map((module) => [
    module.id,
    {
      titulo: module.title,
      percentual: module.percentage,
      contagens: module.counts,
    },
  ]));
}
