-- Gestão de visitas, processos e fila idempotente de integração com Radar Vital.
alter table public.atendimentos add column if not exists titulo text;
alter table public.atendimentos add column if not exists natureza text not null default 'ATENDIMENTO';
alter table public.atendimentos add column if not exists anotacoes_itens jsonb not null default '[]'::jsonb;
alter table public.atendimentos add column if not exists dados_modalidade jsonb;
alter table public.atendimentos add column if not exists modo text not null default 'completa';

create table if not exists public.naturezas_visita (
  codigo text primary key,
  nome text not null,
  ativo boolean not null default true,
  ordem smallint not null default 0,
  created_at timestamptz not null default now()
);

insert into public.naturezas_visita (codigo, nome, ordem) values
  ('ATENDIMENTO', 'Visita de Atendimento', 1),
  ('OBRAS', 'Acompanhamento de Obras', 2),
  ('AMBIENTAL', 'Acompanhamento Ambiental', 3),
  ('PROCESSOS', 'Acompanhamento de Processos', 4)
on conflict (codigo) do nothing;

create table if not exists public.orgaos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.processos_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  obra_id uuid references public.obras(id) on delete set null,
  orgao_id uuid references public.orgaos(id) on delete set null,
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (cliente_id, nome)
);

create table if not exists public.atendimento_processos (
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  orgao_id uuid references public.orgaos(id) on delete set null,
  processo_id uuid references public.processos_clientes(id) on delete set null,
  created_at timestamptz not null default now(),
  check (orgao_id is not null or processo_id is not null)
);

create table if not exists public.mapeamentos_clientes_radar (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  radar_cliente_id uuid not null,
  radar_cliente_nome text not null,
  origem text not null default 'AUTOMATICO',
  updated_at timestamptz not null default now()
);

create table if not exists public.integracao_radar_itens (
  id uuid primary key default gen_random_uuid(),
  atendimento_id uuid not null references public.atendimentos(id) on delete cascade,
  tipo_origem text not null check (tipo_origem in ('DEMANDA', 'ANOTACAO')),
  item_origem_id text not null,
  radar_item_id uuid,
  radar_cliente_id uuid,
  status text not null default 'PENDENTE' check (status in ('PENDENTE', 'ENVIADO', 'FALHOU')),
  erro text,
  enviado_em timestamptz,
  created_at timestamptz not null default now(),
  unique (atendimento_id, tipo_origem, item_origem_id)
);

create index if not exists atendimentos_natureza_data_idx on public.atendimentos (natureza, data_inicio desc);
create index if not exists processos_clientes_cliente_idx on public.processos_clientes (cliente_id);
create index if not exists integracao_radar_pendente_idx on public.integracao_radar_itens (status, atendimento_id);

alter table public.naturezas_visita enable row level security;
alter table public.orgaos enable row level security;
alter table public.processos_clientes enable row level security;
alter table public.atendimento_processos enable row level security;
alter table public.mapeamentos_clientes_radar enable row level security;
alter table public.integracao_radar_itens enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'naturezas_visita' and policyname = 'Authenticated users manage visit natures') then
    create policy "Authenticated users manage visit natures" on public.naturezas_visita for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orgaos' and policyname = 'Authenticated users manage agencies') then
    create policy "Authenticated users manage agencies" on public.orgaos for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'processos_clientes' and policyname = 'Authenticated users manage client processes') then
    create policy "Authenticated users manage client processes" on public.processos_clientes for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atendimento_processos' and policyname = 'Authenticated users manage visit processes') then
    create policy "Authenticated users manage visit processes" on public.atendimento_processos for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mapeamentos_clientes_radar' and policyname = 'Authenticated users manage radar mappings') then
    create policy "Authenticated users manage radar mappings" on public.mapeamentos_clientes_radar for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'integracao_radar_itens' and policyname = 'Authenticated users read radar export history') then
    create policy "Authenticated users read radar export history" on public.integracao_radar_itens for select to authenticated using (true);
  end if;
end $$;
