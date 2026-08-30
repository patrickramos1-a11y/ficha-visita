import type {
  AtendimentoPersonalizadoData,
  AtendimentoPersonalizadoModulo,
  AtendimentoPersonalizadoResposta,
  RespostaConformidadePersonalizada,
} from '@/types/atendimento';

export type PersonalizadoCounts = {
  conforme: number;
  parcial: number;
  naoConforme: number;
  naoSeAplica: number;
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
});

function addCounts(target: PersonalizadoCounts, source: PersonalizadoCounts) {
  target.conforme += source.conforme;
  target.parcial += source.parcial;
  target.naoConforme += source.naoConforme;
  target.naoSeAplica += source.naoSeAplica;
}

function responseScore(response: RespostaConformidadePersonalizada) {
  if (response === 'CONFORME') return 100;
  if (response === 'PARCIAL') return 50;
  if (response === 'NAO_CONFORME') return 0;
  return null;
}

function countResponse(counts: PersonalizadoCounts, response: RespostaConformidadePersonalizada) {
  if (response === 'CONFORME') counts.conforme += 1;
  else if (response === 'PARCIAL') counts.parcial += 1;
  else if (response === 'NAO_CONFORME') counts.naoConforme += 1;
  else if (response === 'NAO_SE_APLICA') counts.naoSeAplica += 1;
}

function percentageFromScores(scores: number[]) {
  if (!scores.length) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

export function buildPersonalizadoConformityReport(
  data?: AtendimentoPersonalizadoData | null,
  photos: Array<{ atendimento_personalizado_item_id?: string | null }> = [],
): PersonalizadoReport | null {
  if (!data) return null;

  const responseByItem = new Map<string, AtendimentoPersonalizadoResposta>();
  for (const response of data.respostas ?? []) responseByItem.set(response.item_id, response);

  const photoItemIds = new Set(photos.map((photo) => photo.atendimento_personalizado_item_id).filter(Boolean));
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
        .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
        .map((item) => {
          const saved = responseByItem.get(item.id);
          const response = (saved?.resposta || '') as RespostaConformidadePersonalizada;
          const hasPhoto = photoItemIds.has(item.id);
          const score = item.entra_conformidade === false ? null : responseScore(response);

          countResponse(counts, response);
          if (score !== null && module.entra_conformidade !== false) scores.push(score);

          if (response === 'NAO_CONFORME') {
            alerts.push({ key: item.id, moduleTitle: module.titulo, label: item.texto, severity: 'critical' });
          } else if (response === 'PARCIAL') {
            alerts.push({ key: item.id, moduleTitle: module.titulo, label: item.texto, severity: 'attention' });
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
