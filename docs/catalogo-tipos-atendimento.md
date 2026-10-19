# Catálogo de tipos de atendimento ambiental

Data da consolidação: 18/10/2026

## Status e finalidade do documento

Este documento é a referência funcional do catálogo de atendimentos no sistema de visitas.

Em 18/10/2026, a implementação foi preparada no repositório por meio da migração `supabase/migrations/20261018210948_consolidate_service_catalog.sql` e das alterações da interface e dos relatórios. A migração ainda precisa ser aplicada ao projeto Supabase correto antes de o catálogo consolidado ficar ativo em produção.

Ele registra:

- os tipos de atendimento reconhecidos pela operação;
- a definição e a finalidade de cada tipo;
- a relação entre tipos, ações e temas técnicos;
- o fluxo esperado de seleção e confirmação;
- os modelos de texto que poderão apoiar a geração dos relatórios.

O documento não representa uma migração já executada no banco remoto. Os códigos, vínculos e regras foram confrontados com o catálogo e com os registros históricos disponíveis em modo de leitura; a execução remota permanece pendente de vínculo e validação no projeto Supabase correto.

## Decisão de consolidação do cadastro existente

Os tipos e as ações deste catálogo **não devem ser inseridos como um segundo catálogo paralelo**. A implementação deverá consolidar os registros que já existem no banco.

### Tipos de atendimento

1. Selecionar 12 registros existentes em `tipos_atendimento_config` para serem os registros canônicos.
2. Reaproveitar os IDs desses registros.
3. Renomeá-los e atualizar suas descrições conforme os 12 tipos definidos neste documento.
4. Redirecionar para esses registros os nomes e vínculos históricos dos tipos equivalentes.
5. Deixar exatamente 12 tipos ativos no catálogo de natureza `ATENDIMENTO`.
6. Desativar, sem excluir, os tipos excedentes dessa natureza depois da migração dos dados históricos.
7. Não inserir um novo tipo quando já houver um registro existente que possa ser consolidado.

Os registros usados exclusivamente pelas naturezas especializadas `OBRAS`, `AMBIENTAL` ou `PROCESSOS` não devem ser desativados por acidente. Qualquer decisão de substituí-los também pelos mesmos 12 tipos precisa ser tratada explicitamente, porque hoje essas modalidades compartilham as tabelas de configuração.

### Ações

1. Selecionar registros existentes em `acoes_especificas_config` para representar as ações canônicas descritas em [`catalogo-atividades-fichas.md`](./catalogo-atividades-fichas.md).
2. Reaproveitar os IDs desses registros e atualizar seus nomes para a forma padronizada.
3. Consolidar sinônimos e variações em uma única ação canônica.
4. Migrar as referências históricas antes de desativar as ações excedentes.
5. Deixar 21 ações canônicas ativas no catálogo da natureza `ATENDIMENTO`.
6. Desativar, sem excluir, as ações substituídas ou redundantes dessa natureza.
7. Preservar as ações exclusivas de outras naturezas até que exista decisão específica sobre elas.
8. Não criar cópias da mesma ação para tipos diferentes.

### Vínculo entre tipos e ações

Cada tipo poderá possuir várias ações e a mesma ação poderá pertencer a vários tipos. A implementação deverá criar uma relação muitos-para-muitos entre os cadastros existentes.

Essa relação é uma estrutura de vínculo, não um novo cadastro de tipos ou ações. Ela deverá permitir:

- associar uma ação a um ou vários tipos;
- ordenar as ações exibidas dentro de cada tipo;
- ativar ou desativar uma associação sem remover a ação;
- registrar quando e por quem o vínculo foi alterado;
- identificar combinações excepcionais encontradas durante as visitas.

Hoje essa relação não existe no esquema: tipos e ações são carregados separadamente e filtrados apenas por `naturezas`. Por isso, o vínculo deverá fazer parte da migração futura.

### Histórico armazenado como texto

Atualmente, `atendimentos.tipos_atendimento` e `atendimentos.acoes_especificas` são listas de textos, e `demandas.tipo_atendimento` também armazena texto. A consolidação deverá atualizar esses campos usando o mapa de equivalências; renomear somente as tabelas de configuração não é suficiente.

A migração deverá:

1. criar um mapa explícito de cada nome antigo para o nome canônico;
2. substituir os nomes antigos nas visitas e demandas;
3. remover duplicidades que surjam dentro da mesma visita após a consolidação;
4. preservar os registros sem correspondência para revisão, sem descartá-los silenciosamente;
5. só então desativar os registros excedentes do catálogo;
6. validar que nenhum histórico continue apontando para um nome desativado.

## Modelo conceitual

Cada visita deve separar quatro dimensões:

1. **Tipo de atendimento:** qual frente de trabalho foi realizada.
2. **Ação:** o que o profissional efetivamente executou.
3. **Tema técnico:** qual assunto, instalação ou obrigação foi abordado.
4. **Resultado:** o que foi constatado, produzido, concluído ou encaminhado.

Um atendimento pode conter vários tipos, ações e temas. A conclusão deve depender da confirmação do que foi realmente executado, e não somente das seleções feitas no início da visita.

## Tipos de atendimento

### ATD-01 — Acompanhamento ambiental

**Definição:** Verificação das condições ambientais, conformidades, obrigações legais e rotinas de controle ambiental do empreendimento.

**Finalidade:** Identificar a situação ambiental do estabelecimento, verificar o atendimento das obrigações aplicáveis e orientar a manutenção ou melhoria das condições de conformidade.

**Modelo de descrição:**

> Realizado acompanhamento ambiental do empreendimento, contemplando [atividades executadas], com registro de [resultados ou constatações].

### ATD-02 — Avaliação técnica de sistemas de tratamento

**Definição:** Avaliação técnica das condições de funcionamento, operação, conservação e necessidades de ajuste dos sistemas de tratamento de efluentes e de água.

**Finalidade:** Verificar as condições operacionais das estações, identificar falhas ou oportunidades de melhoria e orientar o responsável quanto à operação e manutenção.

**Modelo de descrição:**

> Realizada avaliação técnica do sistema de tratamento [identificação], abrangendo [ações executadas] e [condições ou resultados identificados].

### ATD-03 — Tomada de ciência

**Definição:** Conhecimento e avaliação preliminar de uma situação, problema, ocorrência ou demanda apresentada pelo cliente.

**Finalidade:** Compreender a necessidade apresentada, levantar informações iniciais e identificar possíveis encaminhamentos.

**Modelo de descrição:**

> Realizada tomada de ciência referente à situação [assunto apresentado], com levantamento preliminar das informações e identificação de [constatações ou encaminhamentos].

### ATD-04 — Consultoria ambiental

**Definição:** Prestação de orientação e esclarecimento técnico sobre questões ambientais, operacionais ou relacionadas à regularização do empreendimento.

**Finalidade:** Auxiliar o cliente na compreensão de problemas, obrigações e alternativas técnicas, apresentando recomendações fundamentadas.

**Modelo de descrição:**

> Prestada consultoria ambiental relacionada a [tema], envolvendo [análises e orientações realizadas], com recomendações referentes a [assunto].

### ATD-05 — Reunião de alinhamento técnico

**Definição:** Reunião técnica para discussão, acompanhamento e alinhamento de demandas, resultados, responsabilidades e próximos passos.

**Finalidade:** Promover a comunicação entre a equipe técnica, o cliente e os demais envolvidos, registrando decisões e encaminhamentos.

**Modelo de descrição:**

> Realizada reunião de alinhamento técnico sobre [tema], com discussão de [assuntos tratados] e registro dos encaminhamentos definidos.

### ATD-06 — Planejamento

**Definição:** Estruturação de soluções, estratégias, prioridades e etapas necessárias para atender às demandas identificadas.

**Finalidade:** Estabelecer o que deverá ser executado, quais providências são necessárias e como as ações serão organizadas.

**Modelo de descrição:**

> Realizada atividade de planejamento para [finalidade], envolvendo [análises realizadas] e definição de [ações, prioridades ou próximos passos].

### ATD-07 — Implementação de melhoria

**Definição:** Execução ou acompanhamento direto de intervenções, correções, adequações e melhorias ambientais ou operacionais.

**Finalidade:** Promover a implementação das melhorias propostas e verificar sua execução e efetividade.

**Modelo de descrição:**

> Realizada atividade de implementação de melhoria referente a [objeto], contemplando [serviços executados ou acompanhados] e [resultados verificados].

### ATD-08 — Licenciamento ambiental

**Definição:** Acompanhamento e execução de atividades relacionadas à regularização e aos processos de licenciamento ambiental.

**Finalidade:** Verificar processos, analisar exigências, acompanhar vistorias relacionadas ao licenciamento, providenciar documentos e orientar o cumprimento das obrigações aplicáveis.

**Modelo de descrição:**

> Realizado atendimento relacionado ao processo de licenciamento ambiental de [empreendimento ou atividade], envolvendo [ações executadas] e [resultado registrado].

### ATD-09 — Fiscalização ambiental

**Definição:** Atendimento relacionado a fiscalizações, notificações, intimações, autos de infração, exigências e outras ações de controle ambiental.

**Finalidade:** Acompanhar procedimentos de fiscalização, registrar exigências e orientar as providências necessárias.

**Modelo de descrição:**

> Realizado atendimento relacionado à fiscalização ambiental, contemplando [procedimentos acompanhados ou executados] e [constatações ou encaminhamentos].

### ATD-10 — Treinamento ambiental

**Definição:** Capacitação e orientação de equipes, funcionários ou responsáveis sobre procedimentos, práticas e responsabilidades ambientais.

**Finalidade:** Promover a compreensão e a aplicação adequada dos procedimentos de gestão e controle ambiental.

**Modelo de descrição:**

> Realizado treinamento ambiental sobre [tema], destinado a [participantes], contemplando [conteúdo ou procedimentos apresentados].

### ATD-11 — Levantamento técnico

**Definição:** Coleta de informações, medições, observações e evidências para caracterização de instalações, processos, condições ambientais ou necessidades técnicas.

**Finalidade:** Produzir informações que subsidiem projetos, estudos, diagnósticos, melhorias ou processos de regularização.

**Modelo de descrição:**

> Realizado levantamento técnico referente a [objeto ou área], compreendendo [informações, medições ou registros obtidos], para subsidiar [finalidade].

### ATD-12 — Monitoramento ambiental

**Definição:** Acompanhamento sistemático de indicadores, parâmetros, registros e controles relacionados às condições ambientais do empreendimento.

**Finalidade:** Verificar a evolução das condições monitoradas e o atendimento aos critérios e às obrigações estabelecidos.

**Modelo de descrição:**

> Realizado monitoramento ambiental relacionado a [tema ou parâmetro], com verificação de [dados, registros ou condições] e identificação de [resultado].

## Regras para as ações

As ações representam aquilo que o profissional efetivamente realizou durante determinado atendimento.

1. Cada ação deve possuir um código único.
2. A mesma ação deve ser cadastrada somente uma vez, mesmo quando for compatível com vários tipos de atendimento.
3. O nome da ação deve começar, preferencialmente, com verbo no infinitivo.
4. A seleção de um tipo deve apresentar primeiro as ações vinculadas àquela atividade.
5. O profissional deve confirmar somente as ações efetivamente executadas.
6. A conclusão da visita não deve considerar como executada uma ação apenas planejada ou selecionada inicialmente.
7. Uma ação adicional pode ser localizada por pesquisa quando não aparecer no filtro principal.
8. Uma vinculação excepcional deve ficar registrada para avaliação e aperfeiçoamento posterior do catálogo.
9. Cada ação confirmada pode produzir um registro específico de serviço executado.

O padrão do registro específico será:

> Atividade executada + objeto ou assunto + resultado confirmado, quando existente.

A lista inicial de ações normalizadas e o mapeamento das fichas estão registrados em [`catalogo-atividades-fichas.md`](./catalogo-atividades-fichas.md).

## Matriz canônica entre tipos e ações

Os códigos `ACA-01` a `ACA-21` correspondem às ações normalizadas em [`catalogo-atividades-fichas.md`](./catalogo-atividades-fichas.md). A matriz abaixo será a base inicial da relação muitos-para-muitos.

As ações principais devem aparecer primeiro. As complementares continuam disponíveis dentro do tipo, mas com prioridade menor.

| Tipo | Ações principais | Ações complementares |
|---|---|---|
| ATD-01 — Acompanhamento ambiental | ACA-06, ACA-07, ACA-08, ACA-18 | ACA-02, ACA-04, ACA-09, ACA-21 |
| ATD-02 — Avaliação técnica de sistemas de tratamento | ACA-05, ACA-06, ACA-18 | ACA-02, ACA-04, ACA-07, ACA-08, ACA-09 |
| ATD-03 — Tomada de ciência | ACA-02, ACA-04, ACA-08 | ACA-03, ACA-05, ACA-06, ACA-07, ACA-09 |
| ATD-04 — Consultoria ambiental | ACA-02, ACA-09, ACA-21 | ACA-01, ACA-03, ACA-05, ACA-15 |
| ATD-05 — Reunião de alinhamento técnico | ACA-01, ACA-03, ACA-21 | ACA-02, ACA-09, ACA-15 |
| ATD-06 — Planejamento | ACA-03, ACA-05 | ACA-02, ACA-04, ACA-09, ACA-15 |
| ATD-07 — Implementação de melhoria | ACA-10, ACA-20 | ACA-03, ACA-06, ACA-07, ACA-08, ACA-09 |
| ATD-08 — Licenciamento ambiental | ACA-12, ACA-13, ACA-16, ACA-17 | ACA-02, ACA-03, ACA-04, ACA-07, ACA-08, ACA-09, ACA-11, ACA-14, ACA-15, ACA-18 |
| ATD-09 — Fiscalização ambiental | ACA-11, ACA-14 | ACA-02, ACA-03, ACA-04, ACA-07, ACA-08, ACA-09, ACA-12, ACA-13, ACA-15, ACA-21 |
| ATD-10 — Treinamento ambiental | ACA-19 | ACA-01, ACA-09, ACA-21 |
| ATD-11 — Levantamento técnico | ACA-04, ACA-07 | ACA-02, ACA-05, ACA-06, ACA-08 |
| ATD-12 — Monitoramento ambiental | ACA-18 | ACA-02, ACA-04, ACA-06, ACA-07, ACA-08, ACA-09, ACA-21 |

### Legenda das ações canônicas

| Código | Ação |
|---|---|
| ACA-01 | Alinhar tecnicamente |
| ACA-02 | Analisar situação ou documentação |
| ACA-03 | Definir plano de ação ou próximos passos |
| ACA-04 | Levantar dados em campo |
| ACA-05 | Realizar diagnóstico |
| ACA-06 | Inspecionar ou verificar condição |
| ACA-07 | Coletar evidências ou realizar registro fotográfico |
| ACA-08 | Registrar constatação, pendência ou demanda |
| ACA-09 | Orientar cliente, técnico ou equipe |
| ACA-10 | Acompanhar execução de obra |
| ACA-11 | Acompanhar vistoria ou fiscalização |
| ACA-12 | Consultar órgão ou andamento de processo |
| ACA-13 | Protocolar ou abrir processo |
| ACA-14 | Responder notificação, intimação ou exigência |
| ACA-15 | Negociar encaminhamento ou acordo |
| ACA-16 | Cadastrar ou regularizar |
| ACA-17 | Obter ou retirar licença e documento |
| ACA-18 | Monitorar e revisar controles |
| ACA-19 | Treinar equipe |
| ACA-20 | Executar limpeza, instalação, correção ou adequação |
| ACA-21 | Apresentar resultado ou fornecer feedback |

## Regras para os temas técnicos

Os temas técnicos representam o assunto abordado, independentemente do tipo de atendimento ou da ação executada.

1. Uma visita pode possuir vários temas.
2. Um tema não deve gerar automaticamente um novo tipo de atendimento.
3. Instalações, sistemas, obrigações, órgãos e documentos devem ser registrados como temas ou entidades relacionadas, conforme o contexto.
4. Constatações como “falta hidrômetro no poço” devem ser registradas como resultado ou demanda, vinculadas ao tema correspondente.
5. O catálogo inicial de temas está registrado em [`catalogo-atividades-fichas.md`](./catalogo-atividades-fichas.md).

## Fluxo de seleção e confirmação

1. O usuário seleciona um ou vários tipos de atendimento.
2. Para cada tipo, o sistema apresenta as ações vinculadas.
3. O usuário seleciona as ações previstas ou iniciadas.
4. Durante ou ao final da visita, o usuário confirma somente as ações efetivamente executadas.
5. O usuário relaciona os temas, evidências, resultados, constatações e demandas.
6. O sistema permite pesquisar uma ação adicional quando necessário.
7. A combinação excepcional fica registrada para revisão administrativa.
8. O relatório é produzido a partir das informações confirmadas.

## Geração assistida das descrições

O sistema poderá utilizar os modelos de cada tipo para gerar uma primeira versão da descrição do atendimento.

Regras obrigatórias:

1. Os campos entre colchetes devem ser preenchidos somente com informações efetivamente registradas.
2. Quando não houver informação suficiente, o sistema deve solicitar complementação ou gerar uma descrição mais simples.
3. O sistema não deve inventar resultados, constatações, responsáveis, documentos ou providências.
4. Os textos gerados são sugestões e devem permitir revisão e complementação pelo responsável.
5. A versão final deve diferenciar o que foi executado, o que foi apenas planejado e o que permaneceu como demanda.

## Estrutura mínima sugerida para implementação

| Entidade | Informações mínimas |
|---|---|
| Tipo de atendimento | código, nome, definição, finalidade, modelo de descrição, status |
| Ação | código, nome no infinitivo, descrição, status |
| Tema técnico | código, nome, descrição, status |
| Compatibilidade tipo–ação | ID do tipo existente, ID da ação existente, prioridade de exibição, origem do vínculo, status e auditoria |
| Registro da visita | tipo selecionado, ação prevista, ação confirmada, temas, resultado, observação |
| Vínculo de evidência | evidência única, ações comprovadas, temas relacionados, legenda |
| Exceção | tipo, ação pesquisada, responsável, data e motivo |

## Sequência segura da futura migração

1. Exportar uma fotografia dos tipos, ações, visitas e demandas atuais.
2. Definir o registro sobrevivente e o nome canônico de cada grupo equivalente.
3. Registrar o mapa completo `nome_antigo → nome_canônico` para tipos e ações.
4. Resolver previamente conflitos da restrição de nome único.
5. Atualizar os textos históricos em `atendimentos` e `demandas`.
6. Renomear e atualizar os registros canônicos, mantendo seus IDs.
7. Criar e preencher a relação entre tipos e ações.
8. Desativar os registros excedentes, sem exclusão física.
9. Atualizar os tipos gerados do cliente Supabase e o carregamento da interface.
10. Validar contagens, registros sem correspondência, duplicidades e funcionamento do filtro.
11. Testar uma visita nova e relatórios antigos antes de disponibilizar a mudança.

### Critérios de aceite

- existem exatamente 12 tipos ativos na natureza `ATENDIMENTO`;
- nenhum tipo ou ação equivalente foi duplicado durante a migração;
- todos os registros históricos reconhecidos usam nomes canônicos;
- registros ambíguos aparecem em uma lista de revisão;
- os itens excedentes estão inativos, não excluídos;
- ao selecionar um tipo, aparecem somente suas ações vinculadas;
- uma ação compartilhada continua sendo um único registro;
- relatórios históricos permanecem legíveis;
- novas visitas gravam apenas nomes canônicos;
- a operação pode consultar o mapa de substituições executado.

## Critérios para a futura implementação

- confrontar os 12 tipos com os títulos e resumos das visitas existentes;
- medir quais ações aparecem de fato em cada tipo;
- preservar os registros históricos e evitar alterações destrutivas;
- reaproveitar IDs existentes como identificadores estáveis e não depender somente do texto exibido;
- permitir ativação e desativação sem apagar vínculos antigos;
- migrar sinônimos para uma ação única;
- manter separadas as ações previstas e as ações confirmadas;
- registrar auditoria das alterações do catálogo;
- validar os modelos de descrição com exemplos reais antes de automatizar sua geração;
- revisar as combinações excepcionais periodicamente.

## Documentos relacionados

- [`catalogo-atividades-fichas.md`](./catalogo-atividades-fichas.md): classificação das 51 anotações das fichas, ações e temas iniciais.
- [`estudo-atendimentos-acoes.md`](./estudo-atendimentos-acoes.md): diagnóstico dos registros históricos consultados no banco.

Nenhuma configuração ou informação do banco de dados remoto foi alterada durante a elaboração e a implementação local deste catálogo.
