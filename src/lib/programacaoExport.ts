import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import type { AtendimentoData, Demanda } from '@/types/atendimento';

const TEMPLATE_URL = '/templates/programacao-modelo.xlsx';
const ORIGEM_FIXA = 'FICHA';
const STATUS_FIXO = 'EM_EXECUCAO';
const PLANO_FIXO = 'AVULSO';
const TOPICO_FIXO = 'Sisramos';
const SUBTOPICO_FIXO = 'Visita';

// Catálogo lookup type (subset of demandas_especificas with joined topicos/subtopicos)
export interface DemandaCatalogoLookup {
  nome_curto: string;
  descricao_detalhada?: string | null;
  topicos?: { nome: string } | null;
  subtopicos?: { nome: string } | null;
}

export interface ProgramacaoInput {
  atendimento: Pick<AtendimentoData, 'data_inicio' | 'demandas'>;
  clienteNomes: string[];
  responsavelNome?: string;
  catalogo?: DemandaCatalogoLookup[];
}

function resolverDemanda(d: Demanda, catalogo: DemandaCatalogoLookup[] = []) {
  const match = catalogo.find(
    c => c.nome_curto === d.descricao || c.descricao_detalhada === d.descricao
  );
  return {
    descricao: match?.descricao_detalhada || d.descricao,
    topico: match?.topicos?.nome || '',
    subtopico: match?.subtopicos?.nome || '',
  };
}

export async function gerarProgramacaoXlsx(input: ProgramacaoInput): Promise<Blob> {
  const { atendimento, clienteNomes, responsavelNome, catalogo = [] } = input;

  const resp = await fetch(TEMPLATE_URL);
  if (!resp.ok) throw new Error('Falha ao carregar template da Programação');
  const arrayBuffer = await resp.arrayBuffer();

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet = workbook.getWorksheet('Sheet1') || workbook.worksheets[0];
  if (!sheet) throw new Error('Aba Sheet1 não encontrada no template');

  const dataVisita = atendimento.data_inicio ? new Date(atendimento.data_inicio) : new Date();
  const clientes = clienteNomes.length > 0 ? clienteNomes : [''];

  let rowIdx = 2;
  for (const demanda of atendimento.demandas) {
    const resolved = resolverDemanda(demanda, catalogo);
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
      row.getCell(8).value = resolved.descricao;
      // I: Responsável
      row.getCell(9).value = responsavelNome || '';
      // J: Plano
      row.getCell(10).value = demanda.plano || '';
      // K: Status
      row.getCell(11).value = STATUS_FIXO;
      // L: Comentário (vazio)
      // M: Tópico
      row.getCell(13).value = resolved.topico;
      // N: Subtópico
      row.getCell(14).value = resolved.subtopico;
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
  saveAs(blob, `Programacao_${data}_${primeiro}.xlsx`);
}
