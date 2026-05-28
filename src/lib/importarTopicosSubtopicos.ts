import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';

const TOPICO_IMPORTADO_NOME = '(Importado)';

export interface ParsedTopicosSubtopicos {
  topicos: string[];
  subtopicos: string[];
}

/**
 * Lê a planilha modelo e extrai tópicos (col G) e subtópicos (col H) da aba `Planilha2`.
 * Faz trim, remove vazios e deduplica preservando a ordem (case-insensitive).
 */
export async function parseTopicosSubtopicosFromXlsx(file: File): Promise<ParsedTopicosSubtopicos> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const sheet =
    workbook.getWorksheet('Planilha2') ||
    workbook.worksheets.find(s => s.name.toLowerCase() === 'planilha2') ||
    workbook.worksheets[1];

  if (!sheet) throw new Error('Aba Planilha2 não encontrada na planilha');

  const dedupe = (vals: (string | null | undefined)[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of vals) {
      if (!v) continue;
      const trimmed = String(v).trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimmed);
    }
    return out;
  };

  const colG: (string | null)[] = [];
  const colH: (string | null)[] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const g = row.getCell(7).value;
    const h = row.getCell(8).value;
    colG.push(g != null ? String(g) : null);
    colH.push(h != null ? String(h) : null);
  });

  return {
    topicos: dedupe(colG),
    subtopicos: dedupe(colH),
  };
}

/**
 * Substitui completamente tópicos e subtópicos no banco.
 * Subtópicos importados são vinculados a um tópico genérico "(Importado)".
 */
export async function aplicarTopicosSubtopicos(parsed: ParsedTopicosSubtopicos) {
  // 1. Limpa tabelas dependentes primeiro (subtopicos -> topicos)
  // Antes, anular referências em tipos/ações para não quebrar
  await supabase.from('tipos_atendimento_config').update({ topico_id: null, subtopico_id: null }).not('id', 'is', null);
  await supabase.from('acoes_especificas_config').update({ topico_id: null, subtopico_id: null }).not('id', 'is', null);
  await supabase.from('demandas_especificas').update({ topico_id: null, subtopico_id: null }).not('id', 'is', null);

  const { error: errSub } = await supabase.from('subtopicos').delete().not('id', 'is', null);
  if (errSub) throw errSub;
  const { error: errTop } = await supabase.from('topicos').delete().not('id', 'is', null);
  if (errTop) throw errTop;

  // 2. Insere tópicos
  let topicoImportadoId: string | null = null;
  if (parsed.topicos.length > 0) {
    const { error } = await supabase.from('topicos').insert(parsed.topicos.map(nome => ({ nome })));
    if (error) throw error;
  }

  // 3. Garante tópico "(Importado)" para os subtópicos
  if (parsed.subtopicos.length > 0) {
    const existing = await supabase.from('topicos').select('id').eq('nome', TOPICO_IMPORTADO_NOME).maybeSingle();
    if (existing.data?.id) {
      topicoImportadoId = existing.data.id;
    } else {
      const { data, error } = await supabase.from('topicos').insert({ nome: TOPICO_IMPORTADO_NOME }).select('id').single();
      if (error) throw error;
      topicoImportadoId = data.id;
    }

    // 4. Insere subtópicos sob o tópico genérico
    const rows = parsed.subtopicos.map(nome => ({ nome, topico_id: topicoImportadoId! }));
    // Insere em chunks de 500 para evitar limites
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from('subtopicos').insert(chunk);
      if (error) throw error;
    }
  }
}
