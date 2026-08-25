# Aplicação Supabase pelo Lovable

Aplicar primeiro a migration do projeto **Ficha de Visita**:

`supabase/migrations/20260809025612_visit_management_and_radar_exports.sql`

Depois aplicar a migration do projeto **Radar Vital**:

`supabase/migrations/20260809025619_visit_import_metadata.sql`

Para o relatório com IA, aplicar também na **Ficha de Visita**:

`supabase/migrations/20260824105000_visit_ai_report_summary.sql`

Prompt para o Lovable:

> Aplique cada SQL no respectivo projeto Supabase, sem alterar ou remover tabelas e dados existentes. Execute o arquivo por completo, confirme que as novas tabelas estão expostas à Data API e valide as políticas RLS para uso interno sem login (`anon` e `authenticated`). Não é necessário criar usuários no Supabase Authentication. No projeto Radar Vital, confirme as novas colunas de origem em `tasks` e `client_comments` e os dois índices únicos de importação. Não altere as políticas já existentes das tabelas antigas.

Checklist após aplicar:

1. Ficha: existem `naturezas_visita`, `orgaos`, `processos_clientes`, `atendimento_processos`, `mapeamentos_clientes_radar` e `integracao_radar_itens`.
2. Ficha: `atendimentos` possui `titulo`, `modo`, `natureza`, `anotacoes_itens`, `dados_modalidade`, `comentario_base_relatorio`, `resumo_relatorio`, `resumo_relatorio_gerado_em` e `relatorio_publico`.
3. Ficha: `tipos_atendimento_config` e `acoes_especificas_config` possuem `naturezas`; os registros existentes ficam vinculados apenas a `ATENDIMENTO`.
4. Ficha: `processos_clientes` possui `situacao_atual` e permite cadastrar processo com cliente e órgão.
5. Radar: `tasks` e `client_comments` possuem as cinco colunas `external_source`, `external_source_item_id`, `source_visit_id`, `source_visit_title` e `source_visit_date`.
6. Abrir a Ficha sem login e criar uma visita de Processos com mais de um cliente.
7. No Vercel da Ficha, configurar `FICHA_SUPABASE_URL`, `FICHA_SUPABASE_SERVICE_ROLE_KEY`, `RADAR_VITAL_SUPABASE_URL`, `RADAR_VITAL_SUPABASE_SERVICE_ROLE_KEY` e `OPENAI_API_KEY` em Production e Preview. Essas variáveis são de servidor e não devem começar com `VITE_`.
8. Opcional: configurar `OPENAI_REPORT_MODEL`; se não existir, o endpoint usa `gpt-4.1-mini`.
