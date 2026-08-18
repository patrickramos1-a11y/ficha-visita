import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import type { AtendimentoData, Demanda } from '@/types/atendimento';
import { getTopicoSubtopicoFromTipo, getTopicoSubtopicoFromAcao, getTiposCache } from '@/lib/tiposAcoesCache';

const TEMPLATE_URL = '/templates/programacao-modelo.xlsx';
const ORIGEM_FIXA = 'FICHA';
const STATUS_EXECUCAO = 'EM_EXECUCAO';
const STATUS_CONCLUIDA = 'CONCLUIDA';
const PLANO_FIXO = 'AVULSO';
const TOPICO_FALLBACK = 'Radar';
const SUBTOPICO_FALLBACK = 'Visita';

// Catálogo lookup type (subset of demandas_especificas with joined topicos/subtopicos)
export interface DemandaCatalogoLookup {
  nome_curto: string;
  descricao_detalhada?: string | null;
  topicos?: { nome: string } | null;
  subtopicos?: { nome: string } | null;
}

export interface ProgramacaoInput {
  atendimento: Pick<AtendimentoData, 'data_inicio' | 'demandas' | 'tipos_atendimento' | 'acoes_especificas'>;
  clienteNomes: string[];
  responsavelNome?: string;
  catalogo?: DemandaCatalogoLookup[];
  acoesEspecificas?: string[];
}

function resolverDemanda(d: Demanda, catalogo: DemandaCatalogoLookup[] = []) {
  const match = catalogo.find(
    c => c.nome_curto === d.descricao || c.descricao_detalhada === d.descricao
  );
  return {
    descricao: match?.descricao_detalhada || d.descricao,
  };
}

/**
 * Resolve tópico/subtópico para uma demanda:
 * 1. Pelo tipo de atendimento da demanda (vínculo cadastrado em Configurações)
 * 2. Pela primeira ação específica da visita que tenha vínculo
 * 3. Fallback fixo "Radar" / "Visita"
 */
function resolverTopicoSubtopico(d: Demanda, acoes: string[] = []): { topico: string; subtopico: string } {
  if (d.tipo_atendimento) {
    const t = getTopicoSubtopicoFromTipo(d.tipo_atendimento);
    if (t.topico || t.subtopico) {
      return {
        topico: t.topico || TOPICO_FALLBACK,
        subtopico: t.subtopico || SUBTOPICO_FALLBACK,
      };
    }
  }
  for (const acao of acoes) {
    const a = getTopicoSubtopicoFromAcao(acao);
    if (a.topico || a.subtopico) {
      return {
        topico: a.topico || TOPICO_FALLBACK,
        subtopico: a.subtopico || SUBTOPICO_FALLBACK,
      };
    }
  }
  return { topico: TOPICO_FALLBACK, subtopico: SUBTOPICO_FALLBACK };
}

interface LinhaPlanilha {
  descricao: string;
  topico: string;
  subtopico: string;
  status: string;
}

export async function gerarProgramacaoXlsx(input: ProgramacaoInput): Promise<Blob> {
  const { atendimento, clienteNomes, responsavelNome, catalogo = [], acoesEspecificas = [] } = input;

  const resp = await fetch(TEMPLATE_URL);
  if (!resp.ok) throw new Error('Falha ao carregar template da planilha');
  const arrayBuffer = await resp.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!sheet) throw new Error('Aba Sheet1 não encontrada no template');

  const dataVisita = atendimento.data_inicio ? new Date(atendimento.data_inicio) : new Date();
  const clientes = clienteNomes.length > 0 ? clienteNomes : [''];

  // Monta a lista consolidada de linhas a partir das três fontes
  const linhas: LinhaPlanilha[] = [];

  // 1) Tipos de atendimento selecionados → status CONCLUIDA
  const tiposCache = getTiposCache();
  for (const tipo of atendimento.tipos_atendimento || []) {
    const cache = tiposCache.find(t => t.nome === tipo);
    const ts = getTopicoSubtopicoFromTipo(tipo);
    linhas.push({
      descricao: cache?.descricao || tipo,
      topico: ts.topico || TOPICO_FALLBACK,
      subtopico: ts.subtopico || SUBTOPICO_FALLBACK,
      status: STATUS_CONCLUIDA,
    });
  }

  // 2) Ações específicas selecionadas → status CONCLUIDA
  for (const acao of atendimento.acoes_especificas || []) {
    const ts = getTopicoSubtopicoFromAcao(acao);
    linhas.push({
      descricao: acao,
      topico: ts.topico || TOPICO_FALLBACK,
      subtopico: ts.subtopico || SUBTOPICO_FALLBACK,
      status: STATUS_CONCLUIDA,
    });
  }

  // 3) Demandas → status escolhido pelo usuário (default EM_EXECUCAO)
  for (const demanda of atendimento.demandas) {
    const resolved = resolverDemanda(demanda, catalogo);
    const ts = resolverTopicoSubtopico(demanda, acoesEspecificas);
    linhas.push({
      descricao: resolved.descricao,
      topico: ts.topico,
      subtopico: ts.subtopico,
      status: demanda.status || STATUS_EXECUCAO,
    });
  }

  let rowIdx = 2;
  for (const linha of linhas) {
    for (const cliente of clientes) {
      const row = sheet.getRow(rowIdx);
      // A: Código (vazio)
      // B: Data
      row.getCell(2).value = dataVisita;
      row.getCell(2).numFmt = 'dd/mm/yyyy';
      // C, D: Ano, Mês — preservar fórmulas existentes do template
      // E: Mês Inicial (vazio)
      // F: Empresa
      row.getCell(6).value = cliente;
      // G: Origem
      row.getCell(7).value = ORIGEM_FIXA;
      // H: Descrição
      row.getCell(8).value = linha.descricao;
      // I: Responsável
      row.getCell(9).value = responsavelNome || '';
      // J: Plano
      row.getCell(10).value = PLANO_FIXO;
      // K: Status
      row.getCell(11).value = linha.status;
      // L: Comentário (vazio)
      // M: Tópico
      row.getCell(13).value = linha.topico;
      // N: Subtópico
      row.getCell(14).value = linha.subtopico;
      row.commit();
      rowIdx++;
    }
  }

  const buf = await workbook.xlsx.writeBuffer();
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export async function baixarProgramacaoXlsx(input: ProgramacaoInput) {
  const blob = await gerarProgramacaoXlsx(input);
  const data = format(new Date(input.atendimento.data_inicio || new Date()), 'yyyy-MM-dd');
  const primeiro = (input.clienteNomes[0] || 'visita')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);
  saveAs(blob, `Itens_visita_${data}_${primeiro}.xlsx`);
}
