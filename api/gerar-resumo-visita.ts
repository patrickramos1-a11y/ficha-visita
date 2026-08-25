type VisitSummaryPayload = {
  titulo?: string | null;
  modo?: string | null;
  natureza?: string | null;
  clientes?: string[];
  responsavel?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  comentario_base_relatorio?: string | null;
  tipos_atendimento?: string[] | null;
  acoes_especificas?: string[] | null;
  demandas?: Array<{ descricao?: string | null }>;
  comentarios?: Array<{ texto?: string | null }>;
  dados_modalidade?: unknown;
};

function cleanList(values?: (string | null | undefined)[] | null) {
  return (values ?? []).map((value) => String(value ?? '').trim()).filter(Boolean);
}

function compactVisit(payload: VisitSummaryPayload) {
  return {
    titulo: payload.titulo || 'Visita sem titulo',
    modalidade: payload.modo || payload.natureza || 'atendimento',
    clientes: cleanList(payload.clientes),
    responsavel: payload.responsavel || null,
    data_inicio: payload.data_inicio || null,
    data_fim: payload.data_fim || null,
    comentario_base_relatorio: payload.comentario_base_relatorio || '',
    tipos_atendimento: cleanList(payload.tipos_atendimento),
    acoes_especificas: cleanList(payload.acoes_especificas),
    demandas: (payload.demandas ?? []).map((item) => item.descricao?.trim()).filter(Boolean),
    comentarios: (payload.comentarios ?? []).map((item) => item.texto?.trim()).filter(Boolean),
    dados_modalidade: payload.dados_modalidade ?? null,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'A IA ainda nao foi configurada. Adicione OPENAI_API_KEY nas variaveis de ambiente da Vercel.',
    });
  }

  const visit = compactVisit(req.body?.visit ?? req.body ?? {});
  const hasUsefulInput = [
    visit.comentario_base_relatorio,
    ...visit.tipos_atendimento,
    ...visit.acoes_especificas,
    ...visit.demandas,
    ...visit.comentarios,
  ].some(Boolean);

  if (!hasUsefulInput) {
    return res.status(400).json({ error: 'Inclua ao menos um comentario, atendimento, acao, demanda ou observacao da visita.' });
  }

  const prompt = [
    'Voce e um assistente tecnico da Ramos Engenharia.',
    'Escreva um resumo de visita em portugues do Brasil, com tom tecnico, claro e profissional.',
    'Use paragrafos curtos. Nao cite que o texto foi gerado por IA.',
    'Nao invente dados, medicoes, problemas, datas, responsaveis, conclusoes ou pendencias.',
    'Use apenas as informacoes fornecidas. Se houver poucas informacoes, escreva um resumo simples e fiel.',
    'Transforme texto informal em texto pronto para relatorio tecnico.',
    '',
    'Dados da visita em JSON:',
    JSON.stringify(visit, null, 2),
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REPORT_MODEL || 'gpt-4.1-mini',
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 700,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: result?.error?.message || 'Falha ao gerar o resumo tecnico.' });
    }

    const text = result.output_text
      || result.output?.flatMap((item: any) => item.content ?? []).map((content: any) => content.text).filter(Boolean).join('\n')
      || '';

    return res.status(200).json({ resumo: text.trim() });
  } catch (error: any) {
    return res.status(502).json({ error: error?.message || 'Falha ao conectar com a IA.' });
  }
}

