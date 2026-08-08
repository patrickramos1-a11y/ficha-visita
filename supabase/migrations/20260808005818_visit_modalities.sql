create table if not exists public.obras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cliente_id, nome)
);

alter table public.obras enable row level security;
create policy "Acesso público para obras" on public.obras for all using (true) with check (true);
create trigger update_obras_updated_at before update on public.obras for each row execute function public.update_updated_at_column();

alter table public.atendimentos
  add column if not exists modo text not null default 'completa',
  add column if not exists obra_id uuid references public.obras(id) on delete set null,
  add column if not exists dados_modalidade jsonb;

create index if not exists atendimentos_obra_id_idx on public.atendimentos(obra_id);
