-- Simplifica a ficha PCA do Posto Av. Brasil sem apagar registros historicos.
-- Modulos e itens ficam inativos apenas para novas execucoes da ficha.

update public.atendimento_personalizado_modulos m
set ativo = false
from public.atendimentos_personalizados a
where m.atendimento_personalizado_id = a.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and m.titulo in (
    'Recebimento e abastecimento',
    'Educação ambiental',
    'Resultado geral da inspeção',
    'Ações necessárias',
    'Registro de intervenção',
    'Encerramento da ficha'
  );

update public.atendimento_personalizado_itens i
set ativo = false
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a
  on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and i.texto in (
    'Data da última inspeção foi verificada quando aplicável.',
    'Existência de resíduo contaminado armazenado está controlada.',
    'Quantidade acumulada não indica necessidade imediata de coleta.',
    'Câmaras de contenção em condição aparente adequada.',
    'Sistema de monitoramento intersticial sem indicação de anormalidade.'
  );

update public.atendimento_personalizado_itens i
set texto = case i.texto
  when 'Tambores mantidos fechados e sem vazamentos.'
    then 'Os tambores estão mantidos fechados e sem vazamentos?'
  when 'Ausência de mistura aparente entre resíduos comuns e contaminados.'
    then 'A mistura aparente entre resíduos comuns e contaminados está ausente?'
  else i.texto
end
from public.atendimento_personalizado_modulos m
join public.atendimentos_personalizados a
  on a.id = m.atendimento_personalizado_id
where i.modulo_id = m.id
  and a.nome = 'Inspeção PCA - Posto Av. Brasil'
  and i.texto in (
    'Tambores mantidos fechados e sem vazamentos.',
    'Ausência de mistura aparente entre resíduos comuns e contaminados.'
  );

notify pgrst, 'reload schema';
