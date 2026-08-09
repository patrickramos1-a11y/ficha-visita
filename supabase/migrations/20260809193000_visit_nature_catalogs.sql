-- Catálogos iniciais por natureza de visita.
-- Idempotente: cria ou atualiza itens por nome e ajusta apenas natureza/descrição/plano.

alter table public.tipos_atendimento_config add column if not exists naturezas text[] not null default array['ATENDIMENTO'];
alter table public.acoes_especificas_config add column if not exists naturezas text[] not null default array['ATENDIMENTO'];

with tipo_seed(nome, descricao, plano_nome, naturezas) as (
  values
    -- Atendimento padrão
    ('Diagnóstico ambiental', 'Levantamento técnico da situação ambiental do cliente.', 'VIP', array['ATENDIMENTO']),
    ('Licenciamento ambiental', 'Atuação relacionada a licença, renovação, dispensa ou regularização ambiental.', 'VIP', array['ATENDIMENTO']),
    ('Regularização ambiental', 'Organização de pendências e adequações para regularidade ambiental.', 'VIP', array['ATENDIMENTO']),
    ('Gestão de resíduos', 'Avaliação e orientação sobre segregação, armazenamento, coleta e destinação.', 'VIP', array['ATENDIMENTO']),
    ('Gestão de efluentes', 'Avaliação de geração, tratamento, lançamento e controle de efluentes.', 'Premium', array['ATENDIMENTO']),
    ('Gestão de água e outorga', 'Acompanhamento de captação, uso, reservação e outorga de água.', 'Premium', array['ATENDIMENTO']),
    ('Monitoramento ambiental', 'Acompanhamento de medições, controles, registros e evidências ambientais.', 'Premium', array['ATENDIMENTO']),
    ('Auditoria ambiental', 'Verificação estruturada de conformidades, riscos e oportunidades de melhoria.', 'Premium', array['ATENDIMENTO']),
    ('Condicionantes ambientais', 'Acompanhamento de obrigações previstas em licenças e autorizações.', 'VIP', array['ATENDIMENTO']),
    ('Relatórios técnicos', 'Coleta e validação de informações para relatório, laudo ou parecer.', 'Premium', array['ATENDIMENTO']),
    ('Treinamento ambiental', 'Orientação ou capacitação de equipe sobre rotinas ambientais.', 'Premium', array['ATENDIMENTO']),
    ('Planejamento de adequações', 'Definição de ações técnicas, prioridades e próximos passos.', 'Premium', array['ATENDIMENTO']),
    ('Reunião técnica', 'Alinhamento técnico com cliente, equipe ou responsável operacional.', 'VIP', array['ATENDIMENTO']),
    ('Fiscalização ou órgão ambiental', 'Acompanhamento de fiscalização, solicitação ou contato com órgão ambiental.', 'VIP', array['ATENDIMENTO']),
    ('Implantação de melhoria', 'Acompanhamento de melhoria técnica, operacional ou ambiental.', 'Master', array['ATENDIMENTO']),
    ('Acompanhamento operacional', 'Verificação de rotina, funcionamento e execução de procedimentos.', 'VIP', array['ATENDIMENTO']),
    ('Análise documental', 'Conferência de documentos, comprovantes, registros e evidências.', 'VIP', array['ATENDIMENTO']),
    ('Levantamento de campo', 'Coleta de informações, fotos e dados técnicos em campo.', 'VIP', array['ATENDIMENTO']),
    ('Atendimento a notificação', 'Tratamento de notificação, exigência, auto de infração ou comunicação formal.', 'Premium', array['ATENDIMENTO']),
    ('Encerramento de demanda', 'Validação de conclusão, correção ou encaminhamento final de demanda.', 'VIP', array['ATENDIMENTO']),

    -- Obras
    ('Evolução física da obra', 'Acompanhamento do avanço geral e da fase atual da obra.', 'VIP', array['OBRAS']),
    ('Frente de serviço', 'Verificação de atividade em execução e condições da frente de trabalho.', 'VIP', array['OBRAS']),
    ('Instalação de sistema ambiental', 'Acompanhamento de execução de sistema ambiental na obra.', 'Premium', array['OBRAS']),
    ('Instalação hidráulica ou sanitária', 'Acompanhamento de redes, conexões e estruturas hidráulicas/sanitárias.', 'Premium', array['OBRAS']),
    ('Instalação de ETE ou ETA', 'Acompanhamento de implantação, reforma ou ampliação de estação de tratamento.', 'Premium', array['OBRAS']),
    ('Drenagem e escoamento', 'Verificação de drenagem provisória, escoamento e controle de água.', 'VIP', array['OBRAS']),
    ('Terraplenagem e escavação', 'Acompanhamento de movimentação de solo, escavação e terraplenagem.', 'VIP', array['OBRAS']),
    ('Armazenamento de materiais', 'Verificação de organização, acondicionamento e proteção de materiais.', 'VIP', array['OBRAS']),
    ('Resíduos da construção', 'Verificação de resíduos, caçambas, segregação e destinação na obra.', 'VIP', array['OBRAS']),
    ('Segurança e organização do canteiro', 'Verificação de organização, sinalização, acesso e risco aparente.', 'VIP', array['OBRAS']),
    ('Controle ambiental da obra', 'Verificação de impactos ambientais e medidas de controle na obra.', 'Premium', array['OBRAS']),
    ('Interferência em vegetação ou APP', 'Acompanhamento de possível interferência em vegetação, APP ou área sensível.', 'Premium', array['OBRAS']),
    ('Adequação conforme projeto', 'Comparação entre execução em campo e projeto/planta aprovado.', 'Premium', array['OBRAS']),
    ('Compra ou solicitação de materiais', 'Orientação ou registro de necessidade de aquisição de materiais.', 'VIP', array['OBRAS']),
    ('Orientação à equipe de obra', 'Alinhamento técnico com responsável, mestre de obra ou equipe de execução.', 'VIP', array['OBRAS']),
    ('Pendências anteriores da obra', 'Verificação de resolução de pendências registradas em visita anterior.', 'VIP', array['OBRAS']),

    -- Ambiental
    ('Gestão ambiental geral', 'Avaliação geral das rotinas e condições ambientais do empreendimento.', 'VIP', array['AMBIENTAL']),
    ('Resíduos sólidos', 'Verificação de geração, segregação, armazenamento e destinação de resíduos.', 'VIP', array['AMBIENTAL']),
    ('Efluentes líquidos e ETE', 'Verificação de tratamento, operação, lançamento e evidências da ETE.', 'Premium', array['AMBIENTAL']),
    ('Água e abastecimento', 'Verificação de origem, uso, medição e condições de abastecimento de água.', 'VIP', array['AMBIENTAL']),
    ('Poço e outorga', 'Verificação de poço, reservatório, captação e regularidade de outorga.', 'Premium', array['AMBIENTAL']),
    ('Emissões atmosféricas', 'Observação de emissões, fumaça, particulados ou fontes atmosféricas.', 'Premium', array['AMBIENTAL']),
    ('Ruído e odor', 'Verificação de ruído, odor, incômodo ou emissão perceptível.', 'VIP', array['AMBIENTAL']),
    ('Armazenamento de produtos', 'Avaliação de armazenamento, contenção e risco de produtos/insumos.', 'VIP', array['AMBIENTAL']),
    ('Área produtiva', 'Inspeção da área produtiva e práticas operacionais com impacto ambiental.', 'VIP', array['AMBIENTAL']),
    ('Área externa e drenagem', 'Verificação de área externa, drenagem, água acumulada e carreamento.', 'VIP', array['AMBIENTAL']),
    ('Documentação ambiental', 'Conferência de registros, comprovantes, licenças e evidências ambientais.', 'VIP', array['AMBIENTAL']),
    ('Condicionantes de licença', 'Acompanhamento de condicionantes e obrigações ambientais da licença.', 'Premium', array['AMBIENTAL']),
    ('Treinamento ou orientação ambiental', 'Repasse de orientação ou treinamento ambiental em campo.', 'Premium', array['AMBIENTAL']),
    ('Coleta ou amostragem', 'Registro de coleta, amostragem ou preparação para monitoramento.', 'Premium', array['AMBIENTAL']),
    ('Destinação de resíduos', 'Verificação de coleta, comprovante e destino de resíduos.', 'VIP', array['AMBIENTAL']),
    ('Não conformidades ambientais', 'Registro e acompanhamento de não conformidades ambientais.', 'Premium', array['AMBIENTAL']),
    ('Boas práticas operacionais', 'Avaliação de práticas operacionais e oportunidades de melhoria.', 'VIP', array['AMBIENTAL']),

    -- Processos
    ('Licenciamento ambiental de processo', 'Acompanhamento de processo de licenciamento em órgão ambiental.', 'VIP', array['PROCESSOS']),
    ('Renovação de licença', 'Acompanhamento de renovação de licença ou autorização.', 'VIP', array['PROCESSOS']),
    ('Regularização ambiental de processo', 'Acompanhamento de regularização ou correção de situação ambiental.', 'VIP', array['PROCESSOS']),
    ('Autorização ambiental', 'Acompanhamento de autorização específica junto ao órgão.', 'VIP', array['PROCESSOS']),
    ('Outorga de uso da água', 'Acompanhamento de solicitação, renovação ou exigência de outorga.', 'Premium', array['PROCESSOS']),
    ('Dispensa de licença', 'Acompanhamento de solicitação ou emissão de dispensa.', 'VIP', array['PROCESSOS']),
    ('Cadastro ou atualização ambiental', 'Atualização cadastral, inscrição ou regularização em sistema do órgão.', 'VIP', array['PROCESSOS']),
    ('Notificação ambiental', 'Acompanhamento de notificação, prazo ou exigência formal.', 'Premium', array['PROCESSOS']),
    ('Auto de infração', 'Acompanhamento de auto de infração, defesa ou encaminhamento técnico.', 'Premium', array['PROCESSOS']),
    ('Taxas e emolumentos', 'Emissão, retirada ou conferência de taxas/guias do órgão.', 'VIP', array['PROCESSOS']),
    ('Condicionantes do processo', 'Acompanhamento de condicionantes vinculadas ao processo.', 'Premium', array['PROCESSOS']),
    ('Protocolo documental', 'Protocolo ou complementação de documentos no órgão.', 'VIP', array['PROCESSOS']),
    ('Análise técnica do órgão', 'Acompanhamento de análise, despacho ou parecer técnico do órgão.', 'VIP', array['PROCESSOS']),
    ('Reunião institucional', 'Reunião com técnico, secretário, diretor ou representante do órgão.', 'VIP', array['PROCESSOS']),
    ('Retirada de licença ou documento', 'Retirada de licença, documento, notificação ou despacho.', 'VIP', array['PROCESSOS']),
    ('Vistoria do órgão', 'Agendamento, reagendamento ou acompanhamento de vistoria.', 'VIP', array['PROCESSOS'])
)
insert into public.tipos_atendimento_config (nome, descricao, plano_id, naturezas, ativo)
select s.nome, s.descricao, p.id, s.naturezas, true
from tipo_seed s
left join public.planos p on p.nome = s.plano_nome
on conflict (nome) do update
set descricao = excluded.descricao,
    plano_id = excluded.plano_id,
    naturezas = excluded.naturezas,
    ativo = true;

with acao_seed(nome, plano_nome, naturezas) as (
  values
    -- Atendimento padrão
    ('Levantar informações em campo', 'VIP', array['ATENDIMENTO']),
    ('Realizar diagnóstico', 'VIP', array['ATENDIMENTO']),
    ('Analisar documentação', 'VIP', array['ATENDIMENTO']),
    ('Orientar cliente ou equipe', 'VIP', array['ATENDIMENTO']),
    ('Definir próximos passos', 'VIP', array['ATENDIMENTO']),
    ('Coletar evidências', 'VIP', array['ATENDIMENTO']),
    ('Registrar pendências', 'VIP', array['ATENDIMENTO']),
    ('Registrar demandas', 'VIP', array['ATENDIMENTO']),
    ('Validar correção', 'VIP', array['ATENDIMENTO']),
    ('Conferir operação do sistema', 'Premium', array['ATENDIMENTO']),
    ('Elaborar encaminhamento técnico', 'Premium', array['ATENDIMENTO']),
    ('Reunir com cliente', 'VIP', array['ATENDIMENTO']),
    ('Reunir com responsável técnico', 'VIP', array['ATENDIMENTO']),
    ('Revisar situação ambiental', 'VIP', array['ATENDIMENTO']),
    ('Atualizar status de demanda', 'VIP', array['ATENDIMENTO']),

    -- Obras
    ('Verificar avanço da obra', 'VIP', array['OBRAS']),
    ('Comparar execução com projeto', 'Premium', array['OBRAS']),
    ('Orientar responsável da obra', 'VIP', array['OBRAS']),
    ('Tirar dúvidas da equipe', 'VIP', array['OBRAS']),
    ('Conferir frente de serviço', 'VIP', array['OBRAS']),
    ('Conferir instalação executada', 'Premium', array['OBRAS']),
    ('Indicar correção em campo', 'VIP', array['OBRAS']),
    ('Solicitar ajuste de execução', 'VIP', array['OBRAS']),
    ('Solicitar compra de material', 'VIP', array['OBRAS']),
    ('Entregar ou revisar planta/projeto', 'Premium', array['OBRAS']),
    ('Registrar não conformidade', 'VIP', array['OBRAS']),
    ('Registrar pendência de obra', 'VIP', array['OBRAS']),
    ('Conferir resíduos da obra', 'VIP', array['OBRAS']),
    ('Conferir drenagem provisória', 'VIP', array['OBRAS']),
    ('Verificar organização do canteiro', 'VIP', array['OBRAS']),
    ('Validar correção realizada', 'VIP', array['OBRAS']),
    ('Registrar evolução fotográfica', 'VIP', array['OBRAS']),

    -- Ambiental
    ('Inspecionar área produtiva', 'VIP', array['AMBIENTAL']),
    ('Verificar segregação de resíduos', 'VIP', array['AMBIENTAL']),
    ('Conferir acondicionamento de resíduos', 'VIP', array['AMBIENTAL']),
    ('Conferir caçamba ou armazenamento', 'VIP', array['AMBIENTAL']),
    ('Verificar destinação/comprovantes', 'VIP', array['AMBIENTAL']),
    ('Inspecionar ETE', 'Premium', array['AMBIENTAL']),
    ('Verificar operação da ETE', 'Premium', array['AMBIENTAL']),
    ('Conferir odor ou extravasamento', 'VIP', array['AMBIENTAL']),
    ('Conferir lançamento de efluente', 'Premium', array['AMBIENTAL']),
    ('Verificar abastecimento de água', 'VIP', array['AMBIENTAL']),
    ('Conferir poço ou reservatório', 'Premium', array['AMBIENTAL']),
    ('Verificar emissão atmosférica aparente', 'Premium', array['AMBIENTAL']),
    ('Verificar ruído ou odor', 'VIP', array['AMBIENTAL']),
    ('Conferir condicionantes', 'Premium', array['AMBIENTAL']),
    ('Registrar não conformidade ambiental', 'VIP', array['AMBIENTAL']),
    ('Registrar pendência ambiental', 'VIP', array['AMBIENTAL']),
    ('Repassar orientação em campo', 'VIP', array['AMBIENTAL']),
    ('Registrar evidências fotográficas', 'VIP', array['AMBIENTAL']),

    -- Processos
    ('Consultar andamento do processo', 'VIP', array['PROCESSOS']),
    ('Protocolar documento', 'VIP', array['PROCESSOS']),
    ('Complementar documentação', 'VIP', array['PROCESSOS']),
    ('Retirar taxa ou guia', 'VIP', array['PROCESSOS']),
    ('Entregar comprovante de pagamento', 'VIP', array['PROCESSOS']),
    ('Retirar licença ou documento', 'VIP', array['PROCESSOS']),
    ('Retirar notificação ou auto de infração', 'Premium', array['PROCESSOS']),
    ('Reunir com técnico do órgão', 'VIP', array['PROCESSOS']),
    ('Reunir com secretário ou gestor', 'VIP', array['PROCESSOS']),
    ('Esclarecer exigência técnica', 'VIP', array['PROCESSOS']),
    ('Solicitar prioridade ou análise', 'VIP', array['PROCESSOS']),
    ('Agendar vistoria', 'VIP', array['PROCESSOS']),
    ('Reagendar prazo ou atendimento', 'VIP', array['PROCESSOS']),
    ('Conferir pendências do processo', 'VIP', array['PROCESSOS']),
    ('Registrar orientação recebida', 'VIP', array['PROCESSOS']),
    ('Atualizar status do processo', 'VIP', array['PROCESSOS'])
)
insert into public.acoes_especificas_config (nome, plano_id, naturezas, ativo)
select s.nome, p.id, s.naturezas, true
from acao_seed s
left join public.planos p on p.nome = s.plano_nome
on conflict (nome) do update
set plano_id = excluded.plano_id,
    naturezas = excluded.naturezas,
    ativo = true;

-- Itens antigos que eram de obra/ambiental deixam de aparecer na ficha padrão.
update public.acoes_especificas_config
set naturezas = array['OBRAS']
where nome in (
  'Acompanhar obra da ETE',
  'Acom. obra da fábrica',
  'Ac. reforma da estação',
  'Ac. ampliação de sistema'
);

update public.acoes_especificas_config
set naturezas = array['AMBIENTAL']
where nome in (
  'Verificar estrutura física da ETE',
  'Verificar operação em campo',
  'Atuar em área externa',
  'Atuar em área de resíduos',
  'Atuar em área de efluentes',
  'Atuar em frente documental'
);

-- Desativa opções antigas substituídas pelo catálogo revisado.
update public.tipos_atendimento_config
set ativo = false
where nome in (
  'Acompanhamento Ambiental',
  'ETE / ETA',
  'Tomada de Ciência',
  'Consultoria Ambiental',
  'Reunião de Alinhamento',
  'Planejamento de Ação',
  'Implementação de Melhoria',
  'Licenciamento Ambiental',
  'Fiscalização Ambiental',
  'Órgão Ambiental',
  'Treinamento Ambiental'
);

update public.acoes_especificas_config
set ativo = false
where nome in (
  'Acompanhar obra da ETE',
  'Acom. obra da fábrica',
  'Ac. reforma da estação',
  'Ac. ampliação de sistema',
  'Verificar estrutura física da ETE',
  'Verificar operação em campo',
  'Atuar em área externa',
  'Atuar em área de resíduos',
  'Atuar em área de efluentes',
  'Atuar em frente documental'
);
