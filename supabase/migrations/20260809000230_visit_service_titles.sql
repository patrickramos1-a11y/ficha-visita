alter table public.atendimentos
  add column if not exists titulo text;

create index if not exists atendimentos_titulo_idx
on public.atendimentos using btree (titulo);
