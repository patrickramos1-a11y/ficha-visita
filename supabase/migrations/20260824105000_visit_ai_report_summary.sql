alter table public.atendimentos
add column if not exists comentario_base_relatorio text,
add column if not exists resumo_relatorio text,
add column if not exists resumo_relatorio_gerado_em timestamptz,
add column if not exists relatorio_publico boolean default true;

