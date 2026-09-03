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

function responseLabel(response: RespostaConformidadePersonalizada) {
  const labels: Record<string, string> = {
    CONFORME: 'Adequado',
    ADEQUADO: 'Adequado',
    PARCIAL: 'Requer atenção',
    REQUER_ATENCAO: 'Requer atenção',
    NAO_CONFORME: 'Não conforme',
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
    .filter((module) => module.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((module: AtendimentoPersonalizadoModulo) => {
      const counts = emptyCounts();
      const scores: number[] = [];
      const items = (module.itens ?? [])
        .filter((item) => item.ativo !== false)
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
