alter table public.tipos_atendimento_config
  add column if not exists codigo text,
  add column if not exists finalidade text,
  add column if not exists modelo_descricao text;

alter table public.acoes_especificas_config
  add column if not exists codigo text,
  add column if not exists descricao text;

create unique index if not exists tipos_atendimento_config_codigo_key
  on public.tipos_atendimento_config (codigo) where codigo is not null;
create unique index if not exists acoes_especificas_config_codigo_key
  on public.acoes_especificas_config (codigo) where codigo is not null;

create table if not exists public.tipo_atendimento_acoes (
  id uuid primary key default gen_random_uuid(),
  tipo_id uuid not null references public.tipos_atendimento_config(id) on delete cascade,
  acao_id uuid not null references public.acoes_especificas_config(id) on delete cascade,
  principal boolean not null default false,
  prioridade smallint not null default 100 check (prioridade > 0),
  ativo boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tipo_id, acao_id)
);

create index if not exists tipo_atendimento_acoes_tipo_idx
  on public.tipo_atendimento_acoes (tipo_id, ativo, prioridade);
create index if not exists tipo_atendimento_acoes_acao_idx
  on public.tipo_atendimento_acoes (acao_id);

alter table public.tipo_atendimento_acoes enable row level security;
grant select on table public.tipo_atendimento_acoes to anon, authenticated;
grant all on table public.tipo_atendimento_acoes to service_role;

drop policy if exists "Catalogo de vinculos visivel" on public.tipo_atendimento_acoes;
create policy "Catalogo de vinculos visivel"
  on public.tipo_atendimento_acoes for select
  to anon, authenticated
  using (true);

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'update_tipo_atendimento_acoes_updated_at'
      and tgrelid = 'public.tipo_atendimento_acoes'::regclass
  ) then
    create trigger update_tipo_atendimento_acoes_updated_at
      before update on public.tipo_atendimento_acoes
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

create temporary table _canonical_types (
  codigo text primary key,
  survivor_name text not null,
  nome text not null,
  descricao text not null,
  finalidade text not null,
  modelo_descricao text not null
) on commit drop;

insert into _canonical_types values
  ('ATD-01', 'Acompanhamento Ambiental', 'Acompanhamento ambiental', 'Verificação das condições ambientais, conformidades, obrigações legais e rotinas de controle ambiental do empreendimento.', 'Identificar a situação ambiental do estabelecimento, verificar o atendimento das obrigações aplicáveis e orientar a manutenção ou melhoria das condições de conformidade.', 'Realizado acompanhamento ambiental do empreendimento, contemplando [atividades executadas], com registro de [resultados ou constatações].'),
  ('ATD-02', 'ETE / ETA', 'Avaliação técnica de sistemas de tratamento', 'Avaliação técnica das condições de funcionamento, operação, conservação e necessidades de ajuste dos sistemas de tratamento de efluentes e de água.', 'Verificar as condições operacionais das estações, identificar falhas ou oportunidades de melhoria e orientar o responsável quanto à operação e manutenção.', 'Realizada avaliação técnica do sistema de tratamento [identificação], abrangendo [ações executadas] e [condições ou resultados identificados].'),
  ('ATD-03', 'Tomada de Ciência', 'Tomada de ciência', 'Conhecimento e avaliação preliminar de uma situação, problema, ocorrência ou demanda apresentada pelo cliente.', 'Compreender a necessidade apresentada, levantar informações iniciais e identificar possíveis encaminhamentos.', 'Realizada tomada de ciência referente à situação [assunto apresentado], com levantamento preliminar das informações e identificação de [constatações ou encaminhamentos].'),
  ('ATD-04', 'Consultoria Ambiental', 'Consultoria ambiental', 'Prestação de orientação e esclarecimento técnico sobre questões ambientais, operacionais ou relacionadas à regularização do empreendimento.', 'Auxiliar o cliente na compreensão de problemas, obrigações e alternativas técnicas, apresentando recomendações fundamentadas.', 'Prestada consultoria ambiental relacionada a [tema], envolvendo [análises e orientações realizadas], com recomendações referentes a [assunto].'),
  ('ATD-05', 'Reunião de Alinhamento', 'Reunião de alinhamento técnico', 'Reunião técnica para discussão, acompanhamento e alinhamento de demandas, resultados, responsabilidades e próximos passos.', 'Promover a comunicação entre a equipe técnica, o cliente e os demais envolvidos, registrando decisões e encaminhamentos.', 'Realizada reunião de alinhamento técnico sobre [tema], com discussão de [assuntos tratados] e registro dos encaminhamentos definidos.'),
  ('ATD-06', 'Planejamento de Ação', 'Planejamento', 'Estruturação de soluções, estratégias, prioridades e etapas necessárias para atender às demandas identificadas.', 'Estabelecer o que deverá ser executado, quais providências são necessárias e como as ações serão organizadas.', 'Realizada atividade de planejamento para [finalidade], envolvendo [análises realizadas] e definição de [ações, prioridades ou próximos passos].'),
  ('ATD-07', 'Implementação de Melhoria', 'Implementação de melhoria', 'Execução ou acompanhamento direto de intervenções, correções, adequações e melhorias ambientais ou operacionais.', 'Promover a implementação das melhorias propostas e verificar sua execução e efetividade.', 'Realizada atividade de implementação de melhoria referente a [objeto], contemplando [serviços executados ou acompanhados] e [resultados verificados].'),
  ('ATD-08', 'Licenciamento ambiental', 'Licenciamento ambiental', 'Acompanhamento e execução de atividades relacionadas à regularização e aos processos de licenciamento ambiental.', 'Verificar processos, analisar exigências, acompanhar vistorias relacionadas ao licenciamento, providenciar documentos e orientar o cumprimento das obrigações aplicáveis.', 'Realizado atendimento relacionado ao processo de licenciamento ambiental de [empreendimento ou atividade], envolvendo [ações executadas] e [resultado registrado].'),
  ('ATD-09', 'Fiscalização Ambiental', 'Fiscalização ambiental', 'Atendimento relacionado a fiscalizações, notificações, intimações, autos de infração, exigências e outras ações de controle ambiental.', 'Acompanhar procedimentos de fiscalização, registrar exigências e orientar as providências necessárias.', 'Realizado atendimento relacionado à fiscalização ambiental, contemplando [procedimentos acompanhados ou executados] e [constatações ou encaminhamentos].'),
  ('ATD-10', 'Treinamento ambiental', 'Treinamento ambiental', 'Capacitação e orientação de equipes, funcionários ou responsáveis sobre procedimentos, práticas e responsabilidades ambientais.', 'Promover a compreensão e a aplicação adequada dos procedimentos de gestão e controle ambiental.', 'Realizado treinamento ambiental sobre [tema], destinado a [participantes], contemplando [conteúdo ou procedimentos apresentados].'),
  ('ATD-11', 'Levantamento de campo', 'Levantamento técnico', 'Coleta de informações, medições, observações e evidências para caracterização de instalações, processos, condições ambientais ou necessidades técnicas.', 'Produzir informações que subsidiem projetos, estudos, diagnósticos, melhorias ou processos de regularização.', 'Realizado levantamento técnico referente a [objeto ou área], compreendendo [informações, medições ou registros obtidos], para subsidiar [finalidade].'),
  ('ATD-12', 'Monitoramento ambiental', 'Monitoramento ambiental', 'Acompanhamento sistemático de indicadores, parâmetros, registros e controles relacionados às condições ambientais do empreendimento.', 'Verificar a evolução das condições monitoradas e o atendimento aos critérios e às obrigações estabelecidos.', 'Realizado monitoramento ambiental relacionado a [tema ou parâmetro], com verificação de [dados, registros ou condições] e identificação de [resultado].');

create temporary table _canonical_actions (
  codigo text primary key,
  survivor_name text not null,
  nome text not null,
  descricao text not null
) on commit drop;

insert into _canonical_actions values
  ('ACA-01', 'Reunir com cliente', 'Alinhar tecnicamente', 'Promover alinhamento técnico entre cliente, equipe e demais envolvidos.'),
  ('ACA-02', 'Analisar documentação', 'Analisar situação ou documentação', 'Examinar informações, documentos e condições relacionadas ao atendimento.'),
  ('ACA-03', 'Definir próximos passos', 'Definir plano de ação ou próximos passos', 'Estabelecer providências, responsáveis, prioridades e encaminhamentos.'),
  ('ACA-04', 'Levantar informações em campo', 'Levantar dados em campo', 'Coletar informações técnicas, observações e medições no local.'),
  ('ACA-05', 'Realizar diagnóstico', 'Realizar diagnóstico', 'Caracterizar a situação encontrada e suas necessidades técnicas.'),
  ('ACA-06', 'Revisar situação ambiental', 'Inspecionar ou verificar condição', 'Verificar presencialmente condições ambientais, operacionais ou documentais.'),
  ('ACA-07', 'Coletar evidências', 'Coletar evidências ou realizar registro fotográfico', 'Produzir registros comprobatórios do atendimento e das condições observadas.'),
  ('ACA-08', 'Registrar pendências', 'Registrar constatação, pendência ou demanda', 'Documentar ocorrências, necessidades e providências identificadas.'),
  ('ACA-09', 'Orientar cliente ou equipe', 'Orientar cliente, técnico ou equipe', 'Repassar orientação técnica aplicável à situação atendida.'),
  ('ACA-10', 'Acompanhar obra da ETE', 'Acompanhar execução de obra', 'Verificar evolução, condições e aderência da execução de uma obra.'),
  ('ACA-11', 'Agendar vistoria', 'Acompanhar vistoria ou fiscalização', 'Apoiar e registrar vistoria, fiscalização, perícia ou inspeção externa.'),
  ('ACA-12', 'Consultar andamento do processo', 'Consultar órgão ou andamento de processo', 'Consultar situação, exigências e movimentações junto ao órgão competente.'),
  ('ACA-13', 'Protocolar documento', 'Protocolar ou abrir processo', 'Formalizar documento, requerimento ou novo processo perante o órgão competente.'),
  ('ACA-14', 'Esclarecer exigência técnica', 'Responder notificação, intimação ou exigência', 'Preparar ou apresentar resposta a exigência, notificação ou intimação.'),
  ('ACA-15', 'Solicitar prioridade ou análise', 'Negociar encaminhamento ou acordo', 'Negociar solução, acordo ou encaminhamento com as partes envolvidas.'),
  ('ACA-16', 'Complementar documentação', 'Cadastrar ou regularizar', 'Executar cadastro, atualização ou regularização técnica e administrativa.'),
  ('ACA-17', 'Retirar licença ou documento', 'Obter ou retirar licença e documento', 'Obter, receber ou retirar licença, alvará, autorização ou outro documento.'),
  ('ACA-18', 'Atualizar status de demanda', 'Monitorar e revisar controles', 'Acompanhar periodicamente indicadores, registros, prazos e controles.'),
  ('ACA-19', 'Repassar orientação em campo', 'Treinar equipe', 'Capacitar profissionais quanto a procedimentos e responsabilidades.'),
  ('ACA-20', 'Indicar correção em campo', 'Executar limpeza, instalação, correção ou adequação', 'Executar ou acompanhar intervenção, manutenção, instalação ou adequação.'),
  ('ACA-21', 'Reunir com responsável técnico', 'Apresentar resultado ou fornecer feedback', 'Comunicar resultados, conclusões e devolutivas do atendimento.');

do $$
declare missing_types text;
declare missing_actions text;
begin
  select string_agg(c.survivor_name, ', ' order by c.codigo)
    into missing_types
    from _canonical_types c
    where not exists (select 1 from public.tipos_atendimento_config t where t.nome = c.survivor_name);
  select string_agg(c.survivor_name, ', ' order by c.codigo)
    into missing_actions
    from _canonical_actions c
    where not exists (select 1 from public.acoes_especificas_config a where a.nome = c.survivor_name);
  if missing_types is not null then raise exception 'Tipos canônicos sem registro existente: %', missing_types; end if;
  if missing_actions is not null then raise exception 'Ações canônicas sem registro existente: %', missing_actions; end if;
end $$;

update public.tipos_atendimento_config t
set codigo = c.codigo
from _canonical_types c
where t.nome = c.survivor_name and t.codigo is null;

update public.acoes_especificas_config a
set codigo = c.codigo
from _canonical_actions c
where a.nome = c.survivor_name and a.codigo is null;

update public.tipos_atendimento_config set nome = '__catalogo_tipo_' || codigo where codigo like 'ATD-%';
update public.acoes_especificas_config set nome = '__catalogo_acao_' || codigo where codigo like 'ACA-%';

update public.tipos_atendimento_config t
set nome = t.nome || ' [consolidado ' || left(t.id::text, 8) || ']'
where t.codigo is null and exists (select 1 from _canonical_types c where lower(c.nome) = lower(t.nome));

update public.acoes_especificas_config a
set nome = a.nome || ' [consolidado ' || left(a.id::text, 8) || ']'
where a.codigo is null and exists (select 1 from _canonical_actions c where lower(c.nome) = lower(a.nome));

update public.tipos_atendimento_config t
set nome = c.nome,
    descricao = c.descricao,
    finalidade = c.finalidade,
    modelo_descricao = c.modelo_descricao,
    ativo = true,
    naturezas = array(select distinct value from unnest(coalesce(t.naturezas, '{}'::text[]) || array['ATENDIMENTO']) value),
    updated_at = now()
from _canonical_types c where t.codigo = c.codigo;

update public.acoes_especificas_config a
set nome = c.nome,
    descricao = c.descricao,
    ativo = true,
    naturezas = array(select distinct value from unnest(coalesce(a.naturezas, '{}'::text[]) || array['ATENDIMENTO']) value),
    updated_at = now()
from _canonical_actions c where a.codigo = c.codigo;

create temporary table _type_aliases (legacy text primary key, canonical text not null) on commit drop;
insert into _type_aliases values
  ('Acompanhamento Ambiental', 'Acompanhamento ambiental'), ('Acompanhamento operacional', 'Acompanhamento ambiental'), ('Auditoria ambiental', 'Acompanhamento ambiental'), ('Gestão de resíduos', 'Acompanhamento ambiental'), ('Gestão de água e outorga', 'Acompanhamento ambiental'),
  ('ETE / ETA', 'Avaliação técnica de sistemas de tratamento'), ('Gestão de efluentes', 'Avaliação técnica de sistemas de tratamento'),
  ('Tomada de Ciência', 'Tomada de ciência'), ('Diagnóstico ambiental', 'Tomada de ciência'),
  ('Consultoria Ambiental', 'Consultoria ambiental'), ('Análise documental', 'Consultoria ambiental'), ('Encerramento de demanda', 'Consultoria ambiental'),
  ('Reunião de Alinhamento', 'Reunião de alinhamento técnico'), ('Reunião técnica', 'Reunião de alinhamento técnico'),
  ('Planejamento de Ação', 'Planejamento'), ('Planejamento de adequações', 'Planejamento'),
  ('Implementação de Melhoria', 'Implementação de melhoria'), ('Implantação de melhoria', 'Implementação de melhoria'),
  ('Licenciamento Ambiental', 'Licenciamento ambiental'), ('Regularização ambiental', 'Licenciamento ambiental'), ('Órgão Ambiental', 'Licenciamento ambiental'),
  ('Fiscalização Ambiental', 'Fiscalização ambiental'), ('Fiscalização ou órgão ambiental', 'Fiscalização ambiental'), ('Atendimento a notificação', 'Fiscalização ambiental'),
  ('Treinamento Ambiental', 'Treinamento ambiental'),
  ('Levantamento de campo', 'Levantamento técnico'), ('Relatórios técnicos', 'Levantamento técnico'),
  ('Monitoramento ambiental', 'Monitoramento ambiental'), ('Condicionantes ambientais', 'Monitoramento ambiental')
on conflict (legacy) do update set canonical = excluded.canonical;

create temporary table _action_aliases (legacy text primary key, canonical text not null) on commit drop;
insert into _action_aliases
select survivor_name, nome from _canonical_actions
union select nome, nome from _canonical_actions
on conflict (legacy) do update set canonical = excluded.canonical;

insert into _action_aliases values
  ('Conferir operação do sistema', 'Inspecionar ou verificar condição'),
  ('Elaborar encaminhamento técnico', 'Definir plano de ação ou próximos passos'),
  ('Registrar demandas', 'Registrar constatação, pendência ou demanda'),
  ('Validar correção', 'Inspecionar ou verificar condição')
on conflict (legacy) do update set canonical = excluded.canonical;

update public.atendimentos target
set tipos_atendimento = (
  select coalesce(array_agg(mapped order by first_ord), '{}'::text[])
  from (
    select mapped, min(ord) first_ord
    from (
      select coalesce(alias.canonical, source.value) mapped, source.ord
      from unnest(coalesce(target.tipos_atendimento, '{}'::text[])) with ordinality source(value, ord)
      left join _type_aliases alias on lower(trim(alias.legacy)) = lower(trim(source.value))
    ) mapped_values group by mapped
  ) deduplicated
),
acoes_especificas = (
  select coalesce(array_agg(mapped order by first_ord), '{}'::text[])
  from (
    select mapped, min(ord) first_ord
    from (
      select coalesce(alias.canonical, source.value) mapped, source.ord
      from unnest(coalesce(target.acoes_especificas, '{}'::text[])) with ordinality source(value, ord)
      left join _action_aliases alias on lower(trim(alias.legacy)) = lower(trim(source.value))
    ) mapped_values group by mapped
  ) deduplicated
)
where target.natureza = 'ATENDIMENTO'
   or (target.natureza is null and coalesce(target.modo, 'completa') in ('completa', 'rapida'));

update public.demandas d
set tipo_atendimento = alias.canonical
from _type_aliases alias
where lower(trim(d.tipo_atendimento)) = lower(trim(alias.legacy));

update public.tipos_atendimento_config
set naturezas = array_remove(naturezas, 'ATENDIMENTO'),
    ativo = case when cardinality(array_remove(naturezas, 'ATENDIMENTO')) = 0 then false else ativo end,
    updated_at = now()
where codigo is null and 'ATENDIMENTO' = any(naturezas);

update public.acoes_especificas_config
set naturezas = array_remove(naturezas, 'ATENDIMENTO'),
    ativo = case when cardinality(array_remove(naturezas, 'ATENDIMENTO')) = 0 then false else ativo end,
    updated_at = now()
where codigo is null and 'ATENDIMENTO' = any(naturezas);

create temporary table _compatibility (
  tipo_codigo text primary key,
  principais text[] not null,
  complementares text[] not null
) on commit drop;

insert into _compatibility values
  ('ATD-01', array['ACA-06','ACA-07','ACA-08','ACA-18'], array['ACA-02','ACA-04','ACA-09','ACA-21']),
  ('ATD-02', array['ACA-05','ACA-06','ACA-18'], array['ACA-02','ACA-04','ACA-07','ACA-08','ACA-09']),
  ('ATD-03', array['ACA-02','ACA-04','ACA-08'], array['ACA-03','ACA-05','ACA-06','ACA-07','ACA-09']),
  ('ATD-04', array['ACA-02','ACA-09','ACA-21'], array['ACA-01','ACA-03','ACA-05','ACA-15']),
  ('ATD-05', array['ACA-01','ACA-03','ACA-21'], array['ACA-02','ACA-09','ACA-15']),
  ('ATD-06', array['ACA-03','ACA-05'], array['ACA-02','ACA-04','ACA-09','ACA-15']),
  ('ATD-07', array['ACA-10','ACA-20'], array['ACA-03','ACA-06','ACA-07','ACA-08','ACA-09']),
  ('ATD-08', array['ACA-12','ACA-13','ACA-16','ACA-17'], array['ACA-02','ACA-03','ACA-04','ACA-07','ACA-08','ACA-09','ACA-11','ACA-14','ACA-15','ACA-18']),
  ('ATD-09', array['ACA-11','ACA-14'], array['ACA-02','ACA-03','ACA-04','ACA-07','ACA-08','ACA-09','ACA-12','ACA-13','ACA-15','ACA-21']),
  ('ATD-10', array['ACA-19'], array['ACA-01','ACA-09','ACA-21']),
  ('ATD-11', array['ACA-04','ACA-07'], array['ACA-02','ACA-05','ACA-06','ACA-08']),
  ('ATD-12', array['ACA-18'], array['ACA-02','ACA-04','ACA-06','ACA-07','ACA-08','ACA-09','ACA-21']);

insert into public.tipo_atendimento_acoes (tipo_id, acao_id, principal, prioridade, ativo)
select tipo.id, acao.id, mapped.principal, mapped.prioridade, true
from _compatibility matrix
join public.tipos_atendimento_config tipo on tipo.codigo = matrix.tipo_codigo
cross join lateral (
  select code, true principal, ord::smallint prioridade from unnest(matrix.principais) with ordinality p(code, ord)
  union all
  select code, false principal, (50 + ord)::smallint prioridade from unnest(matrix.complementares) with ordinality c(code, ord)
) mapped
join public.acoes_especificas_config acao on acao.codigo = mapped.code
on conflict (tipo_id, acao_id) do update
set principal = excluded.principal,
    prioridade = excluded.prioridade,
    ativo = true,
    updated_at = now();

-- A conformidade passa a ser binária. Respostas intermediárias históricas
-- representam situação ainda não resolvida e, portanto, tornam-se não conformes.
update public.atendimentos atendimento
set percentual_conformidade = null,
    conformidade_por_modulo = '{}'::jsonb,
    updated_at = now()
where exists (
  select 1
  from public.atendimento_personalizado_respostas resposta
  where resposta.atendimento_id = atendimento.id
    and resposta.resposta in ('PARCIAL', 'PARCIALMENTE', 'REQUER_ATENCAO', 'ATENCAO', 'AVALIAR')
);

update public.atendimento_personalizado_respostas
set resposta = 'NAO_CONFORME',
    atualizado_em = now()
where resposta in ('PARCIAL', 'PARCIALMENTE', 'REQUER_ATENCAO', 'ATENCAO', 'AVALIAR');

update public.atendimento_personalizado_itens
set condicional_resposta = 'NAO_CONFORME'
where condicional_resposta in ('PARCIAL', 'PARCIALMENTE', 'REQUER_ATENCAO', 'ATENCAO', 'AVALIAR');

update public.atendimentos
set dados_modalidade = replace(
      replace(
        replace(
          replace(
            replace(dados_modalidade::text, '"PARCIALMENTE"', '"NAO"'),
            '"PARCIAL"', '"NAO_CONFORME"'
          ),
          '"REQUER_ATENCAO"', '"NAO_CONFORME"'
        ),
        '"ATENCAO"', '"NAO_CONFORME"'
      ),
      '"AVALIAR"', '"NAO_CONFORME"'
    )::jsonb,
    percentual_conformidade = null,
    conformidade_por_modulo = '{}'::jsonb,
    updated_at = now()
where dados_modalidade is not null
  and (
    dados_modalidade::text like '%"PARCIALMENTE"%'
    or dados_modalidade::text like '%"PARCIAL"%'
    or dados_modalidade::text like '%"REQUER_ATENCAO"%'
    or dados_modalidade::text like '%"ATENCAO"%'
    or dados_modalidade::text like '%"AVALIAR"%'
  );

do $$
declare type_count integer;
declare action_count integer;
begin
  select count(*) into type_count from public.tipos_atendimento_config where ativo and 'ATENDIMENTO' = any(naturezas);
  select count(*) into action_count from public.acoes_especificas_config where ativo and 'ATENDIMENTO' = any(naturezas);
  if type_count <> 12 then raise exception 'Esperados 12 tipos ATENDIMENTO ativos; encontrados %', type_count; end if;
  if action_count <> 21 then raise exception 'Esperadas 21 ações ATENDIMENTO ativas; encontradas %', action_count; end if;
  if exists (
    select 1
    from public.atendimento_personalizado_respostas
    where resposta in ('PARCIAL', 'PARCIALMENTE', 'REQUER_ATENCAO', 'ATENCAO', 'AVALIAR')
  ) then
    raise exception 'Ainda existem respostas intermediárias no histórico personalizado';
  end if;
end $$;