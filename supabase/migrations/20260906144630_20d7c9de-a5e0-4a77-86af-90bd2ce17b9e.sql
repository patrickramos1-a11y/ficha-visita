alter table public.atendimento_personalizado_itens
add column if not exists resposta_positiva text,
add column if not exists condicional_item_id uuid null references public.atendimento_personalizado_itens(id) on delete set null,
add column if not exists condicional_resposta text,
add column if not exists peso numeric not null default 1,
add column if not exists criticidade text not null default 'normal';

alter table public.atendimento_fotos
add column if not exists tipo_evidencia text,
add column if not exists legenda text;

create table if not exists public.atendimento_foto_itens (
  id uuid primary key default gen_random_uuid(),
  foto_id uuid not null references public.atendimento_fotos(id) on delete cascade,
  item_id uuid not null references public.atendimento_personalizado_itens(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique(foto_id, item_id)
);

create index if not exists atendimento_personalizado_itens_condicional_idx
on public.atendimento_personalizado_itens(condicional_item_id);

create index if not exists atendimento_foto_itens_foto_idx
on public.atendimento_foto_itens(foto_id);

create index if not exists atendimento_foto_itens_item_idx
on public.atendimento_foto_itens(item_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.atendimento_foto_itens TO anon, authenticated;
GRANT ALL ON public.atendimento_foto_itens TO service_role;

alter table public.atendimento_foto_itens enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'atendimento_foto_itens'
      and policyname = 'atendimento_foto_itens_all_authenticated'
  ) then
    create policy "atendimento_foto_itens_all_authenticated"
    on public.atendimento_foto_itens
    for all
    to anon, authenticated
    using (true)
    with check (true);
  end if;
end $$;

update public.atendimento_personalizado_itens i
set
  tipo_resposta = 'SIM_NAO_EVENTO',
  resposta_positiva = 'NAO',
  criticidade = case
    when i.texto ilike any (array[
      '%extravasamento%',
      '%vazamento%',
      '%solo exposto%',
      '%mistura%',
      '%não autorizado%',
      '%sem autorização%'
    ]) then 'alta'
    else coalesce(nullif(i.criticidade, ''), 'normal')
  end
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and (
    i.texto ilike '%houve%'
    or i.texto ilike '%há %'
    or i.texto ilike '%existe%'
    or i.texto ilike '%ocorreu%'
    or i.texto ilike '%extravasamento%'
    or i.texto ilike '%vazamento%'
    or i.texto ilike '%mistura%'
  );

update public.atendimento_personalizado_itens i
set
  tipo_resposta = 'NECESSIDADE_ACAO',
  resposta_positiva = null,
  criticidade = case
    when i.texto ilike any (array[
      '%coleta imediata%',
      '%manutenção imediata%',
      '%correção imediata%',
      '%regularização imediata%'
    ]) then 'alta'
    else coalesce(nullif(i.criticidade, ''), 'normal')
  end
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and (
    i.texto ilike '%necessidade%'
    or i.texto ilike '%requer%'
    or i.texto ilike '%providência%'
    or i.texto ilike '%ação corretiva%'
    or i.texto ilike '%coleta%'
    or i.texto ilike '%manutenção%'
  );

update public.atendimento_personalizado_itens i
set
  tipo_resposta = 'REGISTRO',
  resposta_positiva = null,
  entra_conformidade = false
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and (
    i.texto ilike '%descreva%'
    or i.texto ilike '%registrar%'
    or i.texto ilike '%informar%'
    or i.texto ilike '%data%'
    or i.texto ilike '%volume%'
    or i.texto ilike '%quantidade%'
    or i.texto ilike '%observação%'
  );

update public.atendimento_personalizado_itens i
set tipo_resposta = 'CONFORMIDADE'
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and coalesce(i.tipo_resposta, '') not in ('SIM_NAO_EVENTO', 'NECESSIDADE_ACAO', 'REGISTRO', 'CONDICIONAL');

notify pgrst, 'reload schema';