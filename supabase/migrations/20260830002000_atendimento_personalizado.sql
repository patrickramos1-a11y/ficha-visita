create table if not exists public.atendimentos_personalizados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text not null,
  descricao text,
  status text not null default 'ativo',
  frequencia text,
  responsavel_padrao_id uuid null references public.responsaveis(id) on delete set null,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.atendimento_personalizado_tipos (
  id uuid primary key default gen_random_uuid(),
  atendimento_personalizado_id uuid not null references public.atendimentos_personalizados(id) on delete cascade,
  nome text not null,
  icone text,
  cor text,
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.atendimento_personalizado_acoes (
  id uuid primary key default gen_random_uuid(),
  atendimento_personalizado_id uuid not null references public.atendimentos_personalizados(id) on delete cascade,
  nome text not null,
  icone text,
  cor text,
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.atendimento_personalizado_modulos (
  id uuid primary key default gen_random_uuid(),
  atendimento_personalizado_id uuid not null references public.atendimentos_personalizados(id) on delete cascade,
  titulo text not null,
  descricao text,
  ordem integer not null default 0,
  entra_conformidade boolean not null default true,
  ativo boolean not null default true
);

create table if not exists public.atendimento_personalizado_itens (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references public.atendimento_personalizado_modulos(id) on delete cascade,
  texto text not null,
  tipo_resposta text not null default 'CONFORMIDADE',
  exige_foto boolean not null default false,
  permite_observacao boolean not null default true,
  entra_conformidade boolean not null default true,
  ordem integer not null default 0,
  ativo boolean not null default true
);

create table if not exists public.atendimento_personalizado_respostas (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  item_id uuid not null references public.atendimento_personalizado_itens(id) on delete cascade,
  resposta text,
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique(atendimento_id, item_id)
);

alter table public.atendimentos
add column if not exists atendimento_personalizado_id uuid null references public.atendimentos_personalizados(id),
add column if not exists percentual_conformidade numeric null,
add column if not exists conformidade_por_modulo jsonb not null default '{}'::jsonb;

alter table public.atendimento_fotos
add column if not exists atendimento_personalizado_modulo_id uuid null references public.atendimento_personalizado_modulos(id),
add column if not exists atendimento_personalizado_item_id uuid null references public.atendimento_personalizado_itens(id),
add column if not exists legenda text;

create index if not exists atendimentos_personalizados_cliente_idx on public.atendimentos_personalizados(cliente_id);
create index if not exists atendimento_personalizado_tipos_parent_idx on public.atendimento_personalizado_tipos(atendimento_personalizado_id);
create index if not exists atendimento_personalizado_acoes_parent_idx on public.atendimento_personalizado_acoes(atendimento_personalizado_id);
create index if not exists atendimento_personalizado_modulos_parent_idx on public.atendimento_personalizado_modulos(atendimento_personalizado_id);
create index if not exists atendimento_personalizado_itens_modulo_idx on public.atendimento_personalizado_itens(modulo_id);
create index if not exists atendimento_personalizado_respostas_atendimento_idx on public.atendimento_personalizado_respostas(atendimento_id);
create index if not exists atendimento_personalizado_respostas_item_idx on public.atendimento_personalizado_respostas(item_id);
create index if not exists atendimentos_personalizado_idx on public.atendimentos(atendimento_personalizado_id);
create index if not exists atendimento_fotos_personalizado_modulo_idx on public.atendimento_fotos(atendimento_personalizado_modulo_id);
create index if not exists atendimento_fotos_personalizado_item_idx on public.atendimento_fotos(atendimento_personalizado_item_id);

alter table public.atendimentos_personalizados enable row level security;
alter table public.atendimento_personalizado_tipos enable row level security;
alter table public.atendimento_personalizado_acoes enable row level security;
alter table public.atendimento_personalizado_modulos enable row level security;
alter table public.atendimento_personalizado_itens enable row level security;
alter table public.atendimento_personalizado_respostas enable row level security;

grant select, insert, update, delete on public.atendimentos_personalizados to anon, authenticated;
grant select, insert, update, delete on public.atendimento_personalizado_tipos to anon, authenticated;
grant select, insert, update, delete on public.atendimento_personalizado_acoes to anon, authenticated;
grant select, insert, update, delete on public.atendimento_personalizado_modulos to anon, authenticated;
grant select, insert, update, delete on public.atendimento_personalizado_itens to anon, authenticated;
grant select, insert, update, delete on public.atendimento_personalizado_respostas to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimentos_personalizados' and policyname = 'atendimentos_personalizados_all_authenticated') then
    create policy "atendimentos_personalizados_all_authenticated" on public.atendimentos_personalizados for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_personalizado_tipos' and policyname = 'atendimento_personalizado_tipos_all_authenticated') then
    create policy "atendimento_personalizado_tipos_all_authenticated" on public.atendimento_personalizado_tipos for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_personalizado_acoes' and policyname = 'atendimento_personalizado_acoes_all_authenticated') then
    create policy "atendimento_personalizado_acoes_all_authenticated" on public.atendimento_personalizado_acoes for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_personalizado_modulos' and policyname = 'atendimento_personalizado_modulos_all_authenticated') then
    create policy "atendimento_personalizado_modulos_all_authenticated" on public.atendimento_personalizado_modulos for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_personalizado_itens' and policyname = 'atendimento_personalizado_itens_all_authenticated') then
    create policy "atendimento_personalizado_itens_all_authenticated" on public.atendimento_personalizado_itens for all to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_personalizado_respostas' and policyname = 'atendimento_personalizado_respostas_all_authenticated') then
    create policy "atendimento_personalizado_respostas_all_authenticated" on public.atendimento_personalizado_respostas for all to anon, authenticated using (true) with check (true);
  end if;
end $$;

notify pgrst, 'reload schema';
