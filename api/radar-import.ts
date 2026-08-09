import { createClient } from '@supabase/supabase-js';

type ImportItem = { id: string; descricao?: string; texto?: string; prioridade?: string };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const fichaUrl = process.env.FICHA_SUPABASE_URL;
  const fichaKey = process.env.FICHA_SUPABASE_SERVICE_ROLE_KEY;
  const radarUrl = process.env.RADAR_VITAL_SUPABASE_URL;
  const radarKey = process.env.RADAR_VITAL_SUPABASE_SERVICE_ROLE_KEY;
  if (!fichaUrl || !fichaKey || !radarUrl || !radarKey) return res.status(503).json({ error: 'Integração ainda não foi configurada no Vercel' });
  const ficha = createClient(fichaUrl, fichaKey);
  const radar = createClient(radarUrl, radarKey);
  const { visit, demands = [], notes = [], radarClientId } = req.body ?? {};
  if (!visit?.id || !visit?.clientName) return res.status(400).json({ error: 'Visita e cliente são obrigatórios' });
  let clientId = radarClientId as string | undefined;
  if (!clientId) {
    const { data: clients, error } = await radar.from('clients').select('id,name');
    if (error) return res.status(502).json({ error: 'Não foi possível consultar os clientes do Radar' });
    const candidates = (clients ?? []).filter((client: any) => normalize(client.name) === normalize(visit.clientName));
    if (candidates.length !== 1) return res.status(409).json({ error: candidates.length ? 'Mais de um cliente correspondente no Radar' : 'Cliente não encontrado no Radar', candidates });
    clientId = candidates[0].id;
    await ficha.from('mapeamentos_clientes_radar').upsert({ cliente_id: visit.clientId, radar_cliente_id: clientId, radar_cliente_nome: candidates[0].name, origem: 'AUTOMATICO' }, { onConflict: 'cliente_id' });
  }
  const visitDate = new Date(visit.date).toLocaleDateString('pt-BR');
  const requestedAuthorName = String(visit.responsavelNome ?? '').trim() || 'Ficha de Visita';
  const { data: collaborators } = await radar.from('collaborators').select('name').eq('is_active', true);
  const matchedCollaborator = (collaborators ?? []).find((collaborator: any) => normalize(collaborator.name) === normalize(requestedAuthorName));
  const authorName = matchedCollaborator?.name ?? requestedAuthorName;
  let created = 0;
  const records: any[] = [];
  for (const item of demands as ImportItem[]) {
    if (!item.id || !item.descricao?.trim()) continue;
    const sourceId = `${visit.id}:DEMANDA:${item.id}`;
    const { data, error } = await radar.from('tasks').upsert({ client_id: clientId, title: `[Visita ${visitDate}] ${item.descricao.trim()}`, priority: item.prioridade ?? 'normal', external_source: 'FICHA_VISITA', external_source_item_id: sourceId, source_visit_id: visit.id, source_visit_title: visit.title ?? 'Visita', source_visit_date: visit.date }, { onConflict: 'external_source,external_source_item_id' }).select('id').single();
    if (error) return res.status(502).json({ error: `Falha ao criar tarefa: ${error.message}` });
    records.push({ atendimento_id: visit.id, tipo_origem: 'DEMANDA', item_origem_id: item.id, radar_item_id: data.id, radar_cliente_id: clientId, status: 'ENVIADO', enviado_em: new Date().toISOString() }); created++;
  }
  for (const item of notes as ImportItem[]) {
    if (!item.id || !item.texto?.trim()) continue;
    const sourceId = `${visit.id}:ANOTACAO:${item.id}`;
    const comment = `Levantado na visita: ${visit.title ?? 'Visita'} - ${visitDate}\n\n${item.texto.trim()}`;
    const { data, error } = await radar.from('client_comments').upsert({ client_id: clientId, author_name: authorName, comment_text: comment, comment_type: 'relevante', external_source: 'FICHA_VISITA', external_source_item_id: sourceId, source_visit_id: visit.id, source_visit_title: visit.title ?? 'Visita', source_visit_date: visit.date }, { onConflict: 'external_source,external_source_item_id' }).select('id').single();
    if (error) return res.status(502).json({ error: `Falha ao criar comentário: ${error.message}` });
    records.push({ atendimento_id: visit.id, tipo_origem: 'ANOTACAO', item_origem_id: item.id, radar_item_id: data.id, radar_cliente_id: clientId, status: 'ENVIADO', enviado_em: new Date().toISOString() }); created++;
  }
  if (records.length) await ficha.from('integracao_radar_itens').upsert(records, { onConflict: 'atendimento_id,tipo_origem,item_origem_id' });
  return res.status(200).json({ created, clientId });
}
