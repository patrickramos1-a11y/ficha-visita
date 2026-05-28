import ExcelJS from 'exceljs';
import { supabase } from '@/integrations/supabase/client';

const TOPICO_IMPORTADO_NOME = '(Importado)';

export interface ParsedTopicosSubtopicos {
  topicos: string[];
  subtopicos: string[];
  vinculos: { topico: string; subtopico: string }[];
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
  const vinculos: { topico: string; subtopico: string }[] = [];
  const vinculosSeen = new Set<string>();
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const g = row.getCell(7).value;
    const h = row.getCell(8).value;
    const topico = g != null ? String(g).trim() : '';
    const subtopico = h != null ? String(h).trim() : '';
    colG.push(topico || null);
    colH.push(subtopico || null);
    if (topico && subtopico) {
      const key = `${topico.toLowerCase()}::${subtopico.toLowerCase()}`;
      if (!vinculosSeen.has(key)) {
        vinculosSeen.add(key);
        vinculos.push({ topico, subtopico });
      }
    }
  });

  return {
    topicos: dedupe(colG),
    subtopicos: dedupe(colH),
    vinculos,
  };
}

/**
 * Substitui completamente tópicos e subtópicos no banco.
 * Subtópicos importados são vinculados ao tópico da mesma linha na Planilha2.
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

  // 2. Insere tópicos e monta mapa para vincular subtópicos ao tópico correto
  const normalize = (value: string) => value.trim().toLowerCase();
  const topicosMap = new Map<string, string>();
  let topicoFallbackId: string | null = null;
  if (parsed.topicos.length > 0) {
    const { error } = await supabase.from('topicos').insert(parsed.topicos.map(nome => ({ nome })));
    if (error) throw error;

    const { data: insertedTopicos, error: errFetchTopicos } = await supabase
      .from('topicos')
      .select('id, nome')
      .in('nome', parsed.topicos)
      .limit(5000);
    if (errFetchTopicos) throw errFetchTopicos;
    (insertedTopicos || []).forEach((topico) => topicosMap.set(normalize(topico.nome), topico.id));
    topicoFallbackId = insertedTopicos?.[0]?.id || null;
  }

  // 3. Insere subtópicos usando o vínculo da linha; se não houver tópico na linha, usa fallback
  if (parsed.subtopicos.length > 0) {
    if (!topicoFallbackId) {
      const { data, error } = await supabase.from('topicos').insert({ nome: TOPICO_IMPORTADO_NOME }).select('id').single();
      if (error) throw error;
      topicoFallbackId = data.id;
    }

    const subtopicoToTopico = new Map<string, string>();
    parsed.vinculos.forEach(({ topico, subtopico }) => {
      const topicoId = topicosMap.get(normalize(topico));
      if (topicoId && !subtopicoToTopico.has(normalize(subtopico))) {
        subtopicoToTopico.set(normalize(subtopico), topicoId);
      }
    });

    const rows = parsed.subtopicos.map(nome => ({
      nome,
      topico_id: subtopicoToTopico.get(normalize(nome)) || topicoFallbackId!,
    }));
    // Insere em chunks de 500 para evitar limites
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase.from('subtopicos').insert(chunk);
      if (error) throw error;
    }
  }
}
