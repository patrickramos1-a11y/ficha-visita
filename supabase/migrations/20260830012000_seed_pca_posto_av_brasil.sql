do $$
declare
  v_cliente_id uuid;
  v_atendimento_id uuid;
  v_modulo_id uuid;
  r record;
begin
  if to_regclass('public.atendimentos_personalizados') is null then
    raise notice 'Tabela public.atendimentos_personalizados não existe. Aplique primeiro a migration da fase 1 de atendimentos personalizados.';
    return;
  end if;

  select id
    into v_cliente_id
  from public.clientes
  where nome ilike '%Av. Brasil%'
     or nome ilike '%Posto Av%'
     or nome ilike '%Posto de Combust%'
  order by
    case
      when nome ilike '%Posto%Av. Brasil%' then 0
      when nome ilike '%Av. Brasil%' then 1
      else 2
    end,
    created_at desc
  limit 1;

  if v_cliente_id is null then
    insert into public.clientes (nome)
    values ('Posto de Combustíveis Av. Brasil Ltda.')
    returning id into v_cliente_id;
  end if;

  select id
    into v_atendimento_id
  from public.atendimentos_personalizados
  where cliente_id = v_cliente_id
    and nome = 'Inspeção PCA - Posto Av. Brasil'
  order by criado_em desc
  limit 1;

  if v_atendimento_id is null then
    insert into public.atendimentos_personalizados (
      cliente_id,
      nome,
      descricao,
      status,
      frequencia,
      observacoes
    )
    values (
      v_cliente_id,
      'Inspeção PCA - Posto Av. Brasil',
      'Ficha personalizada de inspeção e acompanhamento dos controles ambientais previstos no Plano de Controle Ambiental - PCA do Posto de Combustíveis Av. Brasil Ltda.',
      'ativo',
      'Mensal',
      'Usar esta ficha para registrar inspeções recorrentes do PCA, com fotos por item, conformidade por módulo, alertas, ações necessárias e registro de intervenções.'
    )
    returning id into v_atendimento_id;
  else
    update public.atendimentos_personalizados
       set descricao = 'Ficha personalizada de inspeção e acompanhamento dos controles ambientais previstos no Plano de Controle Ambiental - PCA do Posto de Combustíveis Av. Brasil Ltda.',
           status = 'ativo',
           frequencia = 'Mensal',
           observacoes = 'Usar esta ficha para registrar inspeções recorrentes do PCA, com fotos por item, conformidade por módulo, alertas, ações necessárias e registro de intervenções.',
           atualizado_em = now()
     where id = v_atendimento_id;
  end if;

  for r in
    select * from (values
      ('Inspeção PCA', 'clipboard-check', 'emerald', 1),
      ('Controle ambiental operacional', 'activity', 'sky', 2),
      ('Gerenciamento de resíduos', 'recycle', 'emerald', 3),
      ('Sistema sanitário', 'droplets', 'cyan', 4),
      ('Drenagem pluvial', 'cloud-rain', 'blue', 5),
      ('SAO / drenagem oleosa', 'filter', 'amber', 6),
      ('Proteção do solo', 'shield-check', 'lime', 7),
      ('Sistema de combustíveis', 'fuel', 'orange', 8),
      ('Condições operacionais', 'settings', 'slate', 9),
      ('Educação ambiental', 'graduation-cap', 'violet', 10),
      ('Registro de ocorrência', 'alert-triangle', 'red', 11),
      ('Acompanhamento de intervenção', 'wrench', 'indigo', 12)
    ) as x(nome, icone, cor, ordem)
  loop
    insert into public.atendimento_personalizado_tipos (
      atendimento_personalizado_id,
      nome,
      icone,
      cor,
      ordem
    )
    select v_atendimento_id, r.nome, r.icone, r.cor, r.ordem
    where not exists (
      select 1
      from public.atendimento_personalizado_tipos t
      where t.atendimento_personalizado_id = v_atendimento_id
        and t.nome = r.nome
    );
  end loop;

  for r in
    select * from (values
      ('Verificar resíduos comuns', 'trash-2', 'emerald', 1),
      ('Verificar resíduos contaminados', 'biohazard', 'red', 2),
      ('Inspecionar fossa séptica', 'droplets', 'cyan', 3),
      ('Inspecionar filtro anaeróbio', 'filter', 'cyan', 4),
      ('Inspecionar sumidouro', 'circle-dot', 'cyan', 5),
      ('Verificar drenagem pluvial', 'cloud-rain', 'blue', 6),
      ('Inspecionar canaletas', 'scan-line', 'blue', 7),
      ('Inspecionar caixas de inspeção', 'box', 'blue', 8),
      ('Avaliar SAO', 'filter', 'amber', 9),
      ('Verificar presença de óleo', 'droplet', 'amber', 10),
      ('Verificar sedimentos', 'layers', 'amber', 11),
      ('Avaliar necessidade de limpeza', 'sparkles', 'emerald', 12),
      ('Verificar piso da pista', 'grid-2x2', 'lime', 13),
      ('Verificar sinais de vazamento', 'search', 'red', 14),
      ('Verificar bombas e mangueiras', 'fuel', 'orange', 15),
      ('Verificar respiros', 'wind', 'sky', 16),
      ('Verificar odor ou ruído', 'volume-2', 'slate', 17),
      ('Verificar área de descarga', 'truck', 'orange', 18),
      ('Verificar registros de treinamento', 'file-check-2', 'violet', 19),
      ('Registrar ação necessária', 'clipboard-list', 'indigo', 20)
    ) as x(nome, icone, cor, ordem)
  loop
    insert into public.atendimento_personalizado_acoes (
      atendimento_personalizado_id,
      nome,
      icone,
      cor,
      ordem
    )
    select v_atendimento_id, r.nome, r.icone, r.cor, r.ordem
    where not exists (
      select 1
      from public.atendimento_personalizado_acoes a
      where a.atendimento_personalizado_id = v_atendimento_id
        and a.nome = r.nome
    );
  end loop;

  for r in
    select * from (values
      ('Identificação da inspeção', 'Registro inicial da inspeção, período, responsável e condição geral da operação.', 1, false),
      ('Gerenciamento de resíduos', 'Verificação de resíduos comuns e contaminados.', 2, true),
      ('Sistema sanitário', 'Fossa séptica, filtro anaeróbio, sumidouro e pontos de inspeção.', 3, true),
      ('Drenagem pluvial', 'Calhas, condutores, caixas e escoamento pluvial.', 4, true),
      ('Drenagem oleosa e SAO', 'Canaletas, caixas, separador de água e óleo, sedimentos e óleo acumulado.', 5, true),
      ('Proteção do solo e sistema de combustíveis', 'Pista, contenções, bombas, mangueiras, descarga e tanques.', 6, true),
      ('Emissões, ruídos e condições operacionais', 'Odor, respiros, ruídos, vibração e reclamações.', 7, true),
      ('Recebimento e abastecimento', 'Área de descarga, pontos, contenção e materiais de resposta.', 8, true),
      ('Educação ambiental', 'Controle documental de treinamento e necessidade de reforço de orientação.', 9, true),
      ('Resultado geral da inspeção', 'Síntese das situações identificadas na inspeção.', 10, true),
      ('Ações necessárias', 'Providências geradas quando houver situação identificada.', 11, true),
      ('Registro de intervenção', 'Registro das intervenções executadas e condição posterior.', 12, true),
      ('Encerramento da ficha', 'Condição final e observações gerais da inspeção.', 13, true)
    ) as x(titulo, descricao, ordem, entra_conformidade)
  loop
    insert into public.atendimento_personalizado_modulos (
      atendimento_personalizado_id,
      titulo,
      descricao,
      ordem,
      entra_conformidade
    )
    select v_atendimento_id, r.titulo, r.descricao, r.ordem, r.entra_conformidade
    where not exists (
      select 1
      from public.atendimento_personalizado_modulos m
      where m.atendimento_personalizado_id = v_atendimento_id
        and m.titulo = r.titulo
    );
  end loop;

  for r in
    select * from (values
      ('Identificação da inspeção', 'Registro comprobatório de acompanhamento dos controles ambientais previstos no PCA foi preenchido.', 1, false, false),
      ('Identificação da inspeção', 'Condição geral da operação está normal.', 2, false, true),
      ('Identificação da inspeção', 'Não houve ocorrência ambiental desde a última inspeção.', 3, false, true),
      ('Identificação da inspeção', 'Data da última inspeção foi verificada quando aplicável.', 4, false, false),

      ('Gerenciamento de resíduos', 'Lixeiras para resíduos comuns disponíveis e em condições adequadas.', 1, false, true),
      ('Gerenciamento de resíduos', 'Resíduos comuns devidamente acondicionados.', 2, false, true),
      ('Gerenciamento de resíduos', 'Ausência de mistura aparente entre resíduos comuns e contaminados.', 3, false, true),
      ('Gerenciamento de resíduos', 'Tambores para resíduos contaminados disponíveis.', 4, true, true),
      ('Gerenciamento de resíduos', 'Tambores mantidos fechados e sem vazamentos.', 5, true, true),
      ('Gerenciamento de resíduos', 'Existência de resíduo contaminado armazenado está controlada.', 6, true, true),
      ('Gerenciamento de resíduos', 'Quantidade acumulada não indica necessidade imediata de coleta.', 7, true, true),
      ('Gerenciamento de resíduos', 'Houve coleta ou destinação desde a última inspeção quando aplicável.', 8, false, true),

      ('Sistema sanitário', 'Ausência de extravasamento aparente.', 1, false, true),
      ('Sistema sanitário', 'Ausência de vazamento aparente.', 2, false, true),
      ('Sistema sanitário', 'Ausência de retorno de efluentes nas instalações.', 3, false, true),
      ('Sistema sanitário', 'Caixas e pontos acessíveis em condição normal.', 4, true, true),
      ('Sistema sanitário', 'Fossa séptica sem indício aparente de sobrecarga.', 5, true, true),
      ('Sistema sanitário', 'Filtro anaeróbio em condição aparente normal.', 6, true, true),
      ('Sistema sanitário', 'Sumidouro sem indício aparente de perda de funcionamento.', 7, true, true),
      ('Sistema sanitário', 'Não há necessidade de limpeza ou manutenção imediata.', 8, false, true),

      ('Drenagem pluvial', 'Calhas e condutores sem obstrução aparente.', 1, false, true),
      ('Drenagem pluvial', 'Caixas de drenagem em condição adequada.', 2, true, true),
      ('Drenagem pluvial', 'Ausência de acúmulo anormal de água.', 3, true, true),
      ('Drenagem pluvial', 'Ausência de resíduos comprometendo o escoamento.', 4, true, true),
      ('Drenagem pluvial', 'Escoamento direcionado à rede pluvial.', 5, false, true),
      ('Drenagem pluvial', 'Não há necessidade de limpeza ou desobstrução imediata.', 6, false, true),

      ('Drenagem oleosa e SAO', 'Canaletas da pista desobstruídas.', 1, true, true),
      ('Drenagem oleosa e SAO', 'Caixas de inspeção em condição adequada.', 2, true, true),
      ('Drenagem oleosa e SAO', 'Ausência de extravasamento.', 3, false, true),
      ('Drenagem oleosa e SAO', 'SAO em condição aparente normal.', 4, true, true),
      ('Drenagem oleosa e SAO', 'Entrada e saída do sistema sem obstrução aparente.', 5, true, true),
      ('Drenagem oleosa e SAO', 'Ausência de presença relevante de material sedimentado.', 6, true, true),
      ('Drenagem oleosa e SAO', 'Ausência de presença ou acúmulo de óleo que justifique intervenção.', 7, true, true),
      ('Drenagem oleosa e SAO', 'Não há necessidade de limpeza da SAO no período.', 8, false, true),
      ('Drenagem oleosa e SAO', 'Não há necessidade de manutenção especializada.', 9, false, true),

      ('Proteção do solo e sistema de combustíveis', 'Piso da pista sem deterioração relevante aparente.', 1, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Ausência de manchas ou sinais de derramamento não tratado.', 2, true, true),
      ('Proteção do solo e sistema de combustíveis', 'SUMPs em condição aparente adequada.', 3, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Câmaras de contenção em condição aparente adequada.', 4, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Pontos de descarga sem sinais aparentes de vazamento.', 5, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Bombas, mangueiras e bicos sem vazamento aparente.', 6, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Sistema de monitoramento intersticial sem indicação de anormalidade.', 7, false, true),
      ('Proteção do solo e sistema de combustíveis', 'Área dos tanques sem evidência superficial anormal.', 8, true, true),
      ('Proteção do solo e sistema de combustíveis', 'Não houve derramamento desde a última inspeção.', 9, false, true),
      ('Proteção do solo e sistema de combustíveis', 'Não houve geração de material contaminado.', 10, false, true),

      ('Emissões, ruídos e condições operacionais', 'Ausência de odor persistente e atípico de combustível.', 1, false, true),
      ('Emissões, ruídos e condições operacionais', 'Respiros sem condição anormal aparente.', 2, false, true),
      ('Emissões, ruídos e condições operacionais', 'Bombas funcionando sem ruído anormal.', 3, false, true),
      ('Emissões, ruídos e condições operacionais', 'Ausência de vibração anormal dos equipamentos.', 4, false, true),
      ('Emissões, ruídos e condições operacionais', 'Não houve reclamação relacionada a ruído ou odor.', 5, false, true),

      ('Recebimento e abastecimento', 'Área de descarga em condição adequada.', 1, true, true),
      ('Recebimento e abastecimento', 'Pontos de descarga sem anormalidade aparente.', 2, true, true),
      ('Recebimento e abastecimento', 'Estruturas de contenção disponíveis.', 3, true, true),
      ('Recebimento e abastecimento', 'Mangueiras e bicos sem vazamento aparente.', 4, false, true),
      ('Recebimento e abastecimento', 'Pista mantida em condição adequada.', 5, false, true),
      ('Recebimento e abastecimento', 'Materiais ou recipientes para resposta a ocorrência disponíveis.', 6, true, true),

      ('Educação ambiental', 'Treinamento ambiental da equipe realizado no ciclo aplicável.', 1, false, true),
      ('Educação ambiental', 'Registro do treinamento disponível.', 2, true, true),
      ('Educação ambiental', 'Não foi identificada necessidade de reforço de orientação.', 3, false, true),

      ('Resultado geral da inspeção', 'Sistemas verificados sem necessidade de intervenção.', 1, false, true),
      ('Resultado geral da inspeção', 'Não foi identificada necessidade de limpeza ou manutenção simples.', 2, false, true),
      ('Resultado geral da inspeção', 'Não foi identificada necessidade de contratação de serviço especializado.', 3, false, true),
      ('Resultado geral da inspeção', 'Não foi identificada ocorrência ambiental que requer tratamento específico.', 4, false, true),
      ('Resultado geral da inspeção', 'Não foi identificada necessidade de avaliação técnica complementar.', 5, false, true),
      ('Resultado geral da inspeção', 'Descrição das situações identificadas foi registrada quando aplicável.', 6, false, false),

      ('Ações necessárias', 'Situação identificada foi descrita quando aplicável.', 1, false, false),
      ('Ações necessárias', 'Ação necessária foi definida quando aplicável.', 2, false, true),
      ('Ações necessárias', 'Responsável pela providência foi indicado quando aplicável.', 3, false, false),
      ('Ações necessárias', 'Situação da providência foi registrada como pendente ou executada quando aplicável.', 4, false, true),

      ('Registro de intervenção', 'Serviço executado foi registrado quando houve intervenção.', 1, true, false),
      ('Registro de intervenção', 'Data da intervenção foi registrada quando aplicável.', 2, false, false),
      ('Registro de intervenção', 'Prestador contratado foi registrado quando aplicável.', 3, false, false),
      ('Registro de intervenção', 'Documento ou comprovante disponível foi verificado.', 4, true, true),
      ('Registro de intervenção', 'Condição após a intervenção foi avaliada.', 5, true, true),

      ('Encerramento da ficha', 'Condição operacional satisfatória.', 1, false, true),
      ('Encerramento da ficha', 'Condição satisfatória com observação registrada quando aplicável.', 2, false, true),
      ('Encerramento da ficha', 'Não há necessidade de intervenção identificada no encerramento.', 3, false, true),
      ('Encerramento da ficha', 'Não há necessidade de avaliação técnica complementar no encerramento.', 4, false, true),
      ('Encerramento da ficha', 'Observações gerais foram registradas quando aplicável.', 5, false, false)
    ) as x(modulo_titulo, texto, ordem, exige_foto, entra_conformidade)
  loop
    select id
      into v_modulo_id
    from public.atendimento_personalizado_modulos
    where atendimento_personalizado_id = v_atendimento_id
      and titulo = r.modulo_titulo
    limit 1;

    if v_modulo_id is not null then
      insert into public.atendimento_personalizado_itens (
        modulo_id,
        texto,
        tipo_resposta,
        exige_foto,
        permite_observacao,
        entra_conformidade,
        ordem
      )
      select v_modulo_id, r.texto, 'CONFORMIDADE', r.exige_foto, true, r.entra_conformidade, r.ordem
      where not exists (
        select 1
        from public.atendimento_personalizado_itens i
        where i.modulo_id = v_modulo_id
          and i.texto = r.texto
      );
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
