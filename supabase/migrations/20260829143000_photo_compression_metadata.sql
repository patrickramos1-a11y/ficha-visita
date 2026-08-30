alter table public.atendimento_fotos
add column if not exists metadata_compressao jsonb not null default '{}'::jsonb;

create index if not exists atendimento_fotos_metadata_compressao_idx
on public.atendimento_fotos using gin (metadata_compressao);

notify pgrst, 'reload schema';
