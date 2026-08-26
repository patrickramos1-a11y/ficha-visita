import { createClient } from "@supabase/supabase-js";

type ImportItem = {
  id: string;
  descricao?: string;
  texto?: string;
  prioridade?: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

const similarityScore = (query: string, name: string) => {
  const normalizedQuery = normalize(query);
  const normalizedName = normalize(name);
  if (!normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 100;
  if (normalizedName.includes(normalizedQuery)) return 86;
  if (normalizedQuery.includes(normalizedName)) return 78;

  const queryTokens = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const nameTokens = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const shared = queryTokens.filter((token) => nameTokens.includes(token));
  if (!shared.length) return 0;
  return Math.round((shared.length / Math.max(queryTokens.length, nameTokens.length)) * 70);
};

const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CL";

export default async function handler(req: any, res: any) {
  const fichaUrl = process.env.FICHA_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const fichaKey =
    process.env.FICHA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.FICHA_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const radarUrl =
    process.env.RADAR_VITAL_SUPABASE_URL || process.env.RADAR_VITAL_VITE_SUPABASE_URL;
  const radarKey =
    process.env.RADAR_VITAL_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RADAR_VITAL_SUPABASE_PUBLISHABLE_KEY ||
    process.env.RADAR_VITAL_VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!fichaUrl || !fichaKey || !radarUrl || !radarKey) {
    return res
      .status(503)
      .json({ error: "Integracao ainda nao foi configurada no Vercel" });
  }

  const ficha = createClient(fichaUrl, fichaKey);
  const radar = createClient(radarUrl, radarKey);

  if (req.method === "GET") {
    const q = String(req.query?.q ?? "");
    const { data: clients, error } = await radar
      .from("clients")
      .select("id,name,initials,is_active")
      .order("name");
    if (error)
      return res
        .status(502)
        .json({ error: "Nao foi possivel consultar os clientes do Radar" });

    const ranked = (clients ?? [])
      .map((client: any) => {
        const score = similarityScore(q, client.name);
        return { ...client, score };
      })
      .filter((client: any) => !q || client.score > 0)
      .sort((a: any, b: any) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 30);

    return res.status(200).json({ clients: ranked });
  }

  if (req.method !== "POST")
    return res.status(405).json({ error: "Metodo nao permitido" });

  const {
    visit,
    demands = [],
    notes = [],
    radarClientId,
    createRadarClientName,
  } = req.body ?? {};
  if (!visit?.id || !visit?.clientName)
    return res.status(400).json({ error: "Visita e cliente sao obrigatorios" });

  let clientId = radarClientId as string | undefined;
  let resolvedClientName = "";

  if (!clientId && createRadarClientName?.trim()) {
    const name = createRadarClientName.trim();
    const { data, error } = await radar
      .from("clients")
      .insert({ name, initials: initialsFromName(name), is_active: true })
      .select("id,name")
      .single();
    if (error)
      return res
        .status(502)
        .json({ error: `Falha ao criar cliente no Radar: ${error.message}` });
    clientId = data.id;
    resolvedClientName = data.name;
  }

  if (!clientId) {
    const { data: clients, error } = await radar
      .from("clients")
      .select("id,name");
    if (error)
      return res
        .status(502)
        .json({ error: "Nao foi possivel consultar os clientes do Radar" });
    const candidates = (clients ?? []).filter(
      (client: any) => normalize(client.name) === normalize(visit.clientName),
    );
    if (candidates.length !== 1) {
      return res.status(409).json({
        error: candidates.length
          ? "Mais de um cliente correspondente no Radar"
          : "Cliente nao encontrado no Radar",
        candidates,
      });
    }
    clientId = candidates[0].id;
    resolvedClientName = candidates[0].name;
  } else {
    const { data } = await radar
      .from("clients")
      .select("name")
      .eq("id", clientId)
      .maybeSingle();
    resolvedClientName = data?.name ?? resolvedClientName;
  }

  if (visit.clientId && clientId) {
    await ficha.from("mapeamentos_clientes_radar").upsert(
      {
        cliente_id: visit.clientId,
        radar_cliente_id: clientId,
        radar_cliente_nome: resolvedClientName || visit.clientName,
        origem: createRadarClientName
          ? "CRIADO"
          : radarClientId
            ? "MANUAL"
            : "AUTOMATICO",
      },
      { onConflict: "cliente_id" },
    );
  }

  const visitDate = new Date(visit.date).toLocaleDateString("pt-BR");
  const requestedAuthorName =
    String(visit.responsavelNome ?? "").trim() || "Ficha de Visita";
  const { data: collaborators } = await radar
    .from("collaborators")
    .select("name")
    .eq("is_active", true);
  const matchedCollaborator = (collaborators ?? []).find(
    (collaborator: any) =>
      normalize(collaborator.name) === normalize(requestedAuthorName),
  );
  const authorName = matchedCollaborator?.name ?? requestedAuthorName;

  let created = 0;
  let failed = 0;
  const records: any[] = [];

  for (const item of demands as ImportItem[]) {
    if (!item.id || !item.descricao?.trim()) continue;
    const sourceId = `${visit.id}:DEMANDA:${item.id}`;
    const { data, error } = await radar
      .from("tasks")
      .upsert(
        {
          client_id: clientId,
          title: `[Visita ${visitDate}] ${item.descricao.trim()}`,
          priority: item.prioridade ?? "normal",
          external_source: "FICHA_VISITA",
          external_source_item_id: sourceId,
          source_visit_id: visit.id,
          source_visit_title: visit.title ?? "Visita",
          source_visit_date: visit.date,
        },
        { onConflict: "external_source,external_source_item_id" },
      )
      .select("id")
      .single();
    if (error) {
      records.push({
        atendimento_id: visit.id,
        tipo_origem: "DEMANDA",
        item_origem_id: item.id,
        radar_cliente_id: clientId,
        status: "FALHOU",
        erro: error.message,
      });
      failed++;
      continue;
    }
    records.push({
      atendimento_id: visit.id,
      tipo_origem: "DEMANDA",
      item_origem_id: item.id,
        radar_item_id: data.id,
        radar_cliente_id: clientId,
        status: "ENVIADO",
        erro: null,
        enviado_em: new Date().toISOString(),
      });
    created++;
  }

  for (const item of notes as ImportItem[]) {
    if (!item.id || !item.texto?.trim()) continue;
    const sourceId = `${visit.id}:ANOTACAO:${item.id}`;
    const comment = `Levantado na visita: ${visit.title ?? "Visita"} - ${visitDate}\n\n${item.texto.trim()}`;
    const { data, error } = await radar
      .from("client_comments")
      .upsert(
        {
          client_id: clientId,
          author_name: authorName,
          comment_text: comment,
          comment_type: "relevante",
          external_source: "FICHA_VISITA",
          external_source_item_id: sourceId,
          source_visit_id: visit.id,
          source_visit_title: visit.title ?? "Visita",
          source_visit_date: visit.date,
        },
        { onConflict: "external_source,external_source_item_id" },
      )
      .select("id")
      .single();
    if (error) {
      records.push({
        atendimento_id: visit.id,
        tipo_origem: "ANOTACAO",
        item_origem_id: item.id,
        radar_cliente_id: clientId,
        status: "FALHOU",
        erro: error.message,
      });
      failed++;
      continue;
    }
    records.push({
      atendimento_id: visit.id,
      tipo_origem: "ANOTACAO",
      item_origem_id: item.id,
        radar_item_id: data.id,
        radar_cliente_id: clientId,
        status: "ENVIADO",
        erro: null,
        enviado_em: new Date().toISOString(),
      });
    created++;
  }

  if (records.length)
    await ficha
      .from("integracao_radar_itens")
      .upsert(records, {
        onConflict: "atendimento_id,tipo_origem,item_origem_id",
      });
  return res.status(failed ? 207 : 200).json({ created, failed, clientId });
}
