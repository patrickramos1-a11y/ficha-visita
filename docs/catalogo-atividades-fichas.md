# Catálogo consolidado das atividades registradas nas fichas

Data da consolidação: 18/10/2026

## Objetivo

Organizar as anotações das fichas de visita em uma estrutura que possa ser usada no sistema sem misturar tipos de atendimento, ações, assuntos técnicos, resultados e demandas.

Este documento preserva o sentido dos registros informados e propõe uma primeira normalização. Ele deve ser validado antes de qualquer migração ou alteração no banco de dados.

## Estrutura adotada

Cada registro pode conter até quatro informações:

1. **Modalidade:** como o atendimento aconteceu.
2. **Ação:** o que foi executado pelo técnico.
3. **Tema técnico:** sobre qual assunto o trabalho foi realizado.
4. **Resultado ou demanda:** o que foi produzido, constatado ou ficou pendente.

Exemplo:

> Reunião de alinhamento sobre auto de infração

- Modalidade: Reunião técnica e alinhamento
- Ação: Analisar situação e definir plano de resposta
- Tema: Fiscalização, auto de infração e passivo ambiental
- Resultado esperado: Plano de ação definido

## Modalidades consolidadas

| Código | Modalidade | Definição |
|---|---|---|
| MOD-01 | Reunião técnica e alinhamento | Discussão, decisão, planejamento, negociação ou devolutiva com cliente, equipe ou terceiro. |
| MOD-02 | Levantamento e diagnóstico | Coleta de dados, medições, registros e análise inicial para compreender uma situação ou preparar um projeto. |
| MOD-03 | Visita e inspeção técnica | Verificação presencial de instalações, sistemas, documentos ou condições ambientais. |
| MOD-04 | Acompanhamento operacional | Acompanhamento do funcionamento de sistemas e rotinas do cliente. |
| MOD-05 | Acompanhamento de obra | Verificação da execução física, evolução e conformidade de obra ou melhoria. |
| MOD-06 | Acompanhamento de vistoria ou fiscalização | Apoio ao cliente durante vistoria, fiscalização, perícia ou elaboração de laudo. |
| MOD-07 | Diligência regulatória | Atuação perante prefeitura, órgão ambiental, vigilância sanitária, IBAMA, Bombeiros ou outro órgão. |
| MOD-08 | Monitoramento periódico | Revisão recorrente de controles, condicionantes, resíduos, produtos ou indicadores. |
| MOD-09 | Treinamento e orientação | Capacitação, apresentação de procedimento ou orientação técnica. |
| MOD-10 | Intervenção, implantação ou manutenção | Execução ou acompanhamento direto de limpeza, instalação, correção, adequação ou melhoria. |

## Ações consolidadas

| Código | Ação padronizada |
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

## Temas técnicos consolidados

| Código | Tema técnico |
|---|---|
| TEM-01 | Licenciamento, alvarás e regularização |
| TEM-02 | Fiscalização, notificações, intimações e autos de infração |
| TEM-03 | ETE, ETA, ETL, fossa, esgoto e efluentes |
| TEM-04 | Água, poço, hidrômetro, irrigação, fertirrigação e outorga |
| TEM-05 | Resíduos sólidos, coleta e destinação |
| TEM-06 | Produtos controlados e defensivos |
| TEM-07 | Projetos, planejamento, ampliação e obras |
| TEM-08 | Condicionantes e monitoramento ambiental |
| TEM-09 | Cadastros, autorizações e atuação de órgãos |
| TEM-10 | Laudos, relatórios e registros fotográficos |
| TEM-11 | Políticas, procedimentos e gestão ambiental |
| TEM-12 | Treinamento e capacitação |

## Classificação das anotações das fichas

| Nº | Anotação original | Modalidade proposta | Ação normalizada | Tema | Resultado, demanda ou observação |
|---:|---|---|---|---|---|
| 1 | Reunião de alinhamento sobre tratamento | Reunião técnica | Alinhar tecnicamente; definir próximos passos | ETE e efluentes | Plano de tratamento alinhado |
| 2 | Andar com o processo de alvará | Diligência regulatória | Consultar andamento; protocolar documento | Licenciamento e alvarás | Processo movimentado |
| 3 | Andar com o processo da VISA | Diligência regulatória | Consultar andamento; atender exigência | Vigilância sanitária e regularização | Processo movimentado |
| 4 | Ver treinamento da ETE | Treinamento e orientação | Planejar ou realizar treinamento | ETE; treinamento | Confirmar se o registro significa planejar, acompanhar ou executar o treinamento |
| 5 | Ver hidrômetro | Visita e inspeção técnica | Inspecionar ou verificar condição | Água, poço e hidrômetro | Condição do hidrômetro registrada |
| 6 | Aquisição | Não definido | Registrar demanda | Tema não informado | Registro incompleto; é necessário informar o objeto da aquisição |
| 7 | Comparecimento à SEMA para responder intimação | Diligência regulatória | Responder intimação | Fiscalização e intimação | Resposta apresentada ao órgão |
| 8 | Acompanhamento de obra de lagoa | Acompanhamento de obra | Acompanhar execução | Lagoa, ETE e obra | Evolução e ajustes registrados |
| 9 | Reunião de alinhamento para responder notificação | Reunião técnica | Analisar situação; definir resposta | Notificação ambiental | Plano de resposta definido |
| 10 | Levantamento de dados para projetos | Levantamento e diagnóstico | Levantar dados em campo | Projetos e planejamento | Base técnica para projeto produzida |
| 11 | Acompanhar vistoria de fiscalização junto à SEMA | Acompanhamento de vistoria | Acompanhar fiscalização | Fiscalização ambiental | Exigências e orientações registradas |
| 12 | Reunião de acompanhamento para responder notificação | Reunião técnica | Revisar andamento; definir resposta | Notificação ambiental | Encaminhamento atualizado |
| 13 | Reunião de alinhamento dos processos de fertirrigação | Reunião técnica | Alinhar tecnicamente; definir próximos passos | Fertirrigação | Plano de trabalho alinhado |
| 14 | Reunião de alinhamento da notificação | Reunião técnica | Analisar situação; planejar resposta | Notificação ambiental | Plano de resposta definido |
| 15 | Consulta sobre alvará | Diligência regulatória | Consultar órgão ou processo | Alvará | Situação do processo consultada |
| 16 | Negociação junto à DEMA para acordo ambiental | Diligência regulatória | Negociar encaminhamento ou acordo | Acordo e passivo ambiental | Termos negociados ou pendentes |
| 17 | Visita à prefeitura para alvará | Diligência regulatória | Consultar órgão; protocolar ou retirar documento | Alvará | Andamento ou documento obtido |
| 18 | Abrir processo na CEMAT | Diligência regulatória | Protocolar ou abrir processo | Regularização junto a órgão | Validar a sigla do órgão antes do cadastro |
| 19 | Pegar licença do alvará | Diligência regulatória | Obter ou retirar documento | Licenciamento e alvará | Documento retirado |
| 20 | Pegar licença da “INS de consulte” | Diligência regulatória | Obter ou retirar documento | Licenciamento | Expressão transcrita com incerteza; validar órgão e documento |
| 21 | Reunião de alinhamento sobre auto de infração | Reunião técnica | Analisar situação; definir plano de resposta | Auto de infração | Plano de ação definido |
| 22 | Reunião de melhoria da ETE | Reunião técnica | Diagnosticar; definir melhorias | ETE e efluentes | Melhorias priorizadas |
| 23 | Levantamento inicial de fertirrigação | Levantamento e diagnóstico | Levantar dados; realizar diagnóstico | Fertirrigação | Diagnóstico inicial produzido |
| 24 | Levantamento para projetos | Levantamento e diagnóstico | Levantar dados em campo | Projetos e planejamento | Base de projeto produzida |
| 25 | Levantamento da ampliação da ETE | Levantamento e diagnóstico | Levantar dados; dimensionar necessidade | ETE, ampliação e obra | Escopo de ampliação identificado |
| 26 | Levantamento para projetos de LOC | Levantamento e diagnóstico | Levantar dados e documentos | Licenciamento; LOC | Base para processo ou projeto produzida |
| 27 | Levantamento de projetos | Levantamento e diagnóstico | Levantar e revisar informações | Projetos | Escopo de projeto identificado |
| 28 | Levantamento fotográfico geral | Levantamento e diagnóstico | Coletar evidências fotográficas | Registro fotográfico | Acervo de evidências produzido |
| 29 | Reunião para tratar da ETE e irrigação | Reunião técnica | Analisar situação; alinhar próximos passos | ETE, água e irrigação | Encaminhamentos definidos |
| 30 | Acompanhamento de vistoria para laudo de resort | Acompanhamento de vistoria | Acompanhar vistoria; coletar evidências | Laudo técnico | Informações para laudo registradas |
| 31 | Acompanhamento de obra de ampliação | Acompanhamento de obra | Acompanhar execução; verificar avanço | Ampliação e obra | Evolução da obra registrada |
| 32 | Reunião de alinhamento | Reunião técnica | Alinhar tecnicamente | Tema não informado | Registro precisa do assunto e do resultado esperado |
| 33 | Reunião de alinhamento de plano | Reunião técnica | Revisar e definir plano de ação | Planejamento | Plano alinhado |
| 34 | Reunião sobre helioposto | Reunião técnica | Analisar situação; definir próximos passos | Licenciamento ou projeto de helioponto | Validar se “helioposto” significa heliporto ou heliponto |
| 35 | Esgoto de fossa | Não definido | Inspecionar, diagnosticar ou orientar | Fossa e esgoto | Frase contém somente o tema; falta informar o trabalho realizado |
| 36 | Reunião de alinhamento para tratar sobre esgoto | Reunião técnica | Analisar situação; definir próximos passos | Fossa, esgoto e efluentes | Encaminhamento definido |
| 37 | Rever monitoramento de resíduos | Monitoramento periódico | Monitorar e revisar controles | Resíduos sólidos | Situação do monitoramento revisada |
| 38 | Rever monitoramento de produtos controlados | Monitoramento periódico | Monitorar e revisar controles | Produtos controlados | Situação do monitoramento revisada |
| 39 | Levantamento de projetos e planejamentos | Levantamento e diagnóstico | Levantar dados; analisar documentação | Projetos e planejamento | Escopo e prioridades identificados |
| 40 | Levantamento de demandas do que deve ser licenciado | Levantamento e diagnóstico | Identificar demandas; realizar diagnóstico | Licenciamento | Demandas de regularização registradas |
| 41 | Monitoramento de condicionantes | Monitoramento periódico | Monitorar prazos e cumprimento | Condicionantes | Status e pendências atualizados |
| 42 | Cadastro do IBAMA | Diligência regulatória | Cadastrar ou atualizar regularização | IBAMA e cadastros | Cadastro realizado ou atualizado |
| 43 | “A pitch de bombeiro” | Não definido | Consultar, protocolar ou obter documento | Corpo de Bombeiros | Transcrição incerta; validar se corresponde a AVCB, CLCB, APPCI ou outro documento |
| 44 | VISA | Não definido | Consultar, protocolar ou atender exigência | Vigilância sanitária | Frase contém somente o órgão; falta informar a ação |
| 45 | Monitoramento de resíduos | Monitoramento periódico | Monitorar e revisar controles | Resíduos sólidos | Status e pendências atualizados |
| 46 | Monitoramento de defensivos | Monitoramento periódico | Monitorar e revisar controles | Defensivos | Status e pendências atualizados |
| 47 | Feedback mensal | Reunião técnica | Apresentar resultado; fornecer feedback | Gestão ambiental geral | Resultado mensal apresentado |
| 48 | Política de água | Treinamento e orientação | Apresentar política; orientar equipe | Água e gestão ambiental | Política apresentada ou revisada |
| 49 | Tipos de licenciamento | Treinamento, reunião ou levantamento | Orientar ou analisar enquadramento | Licenciamento | Definição depende do contexto da ficha |
| 50 | Limpeza da ETL | Intervenção ou manutenção | Executar ou acompanhar limpeza | ETL, ETE e efluentes | Limpeza executada ou demandada; registrar o status |
| 51 | Falta hidrômetro no poço | Visita e inspeção técnica | Verificar condição; registrar demanda | Poço, hidrômetro e outorga | Demanda: instalar ou regularizar hidrômetro |

## Consolidação de duplicidades e variações

As expressões abaixo representam a mesma família e não devem virar cadastros diferentes:

| Variações encontradas | Forma consolidada |
|---|---|
| Reunião de alinhamento, reunião de acompanhamento, reunião para tratar | Reunião técnica e alinhamento |
| Levantamento para projeto, levantamento de projeto, levantamento de dados | Levantamento e diagnóstico |
| Andar com processo, consultar processo, verificar andamento | Consultar andamento do processo |
| Pegar licença, retirar licença, buscar documento | Obter ou retirar licença e documento |
| Rever monitoramento, conferir monitoramento | Monitorar e revisar controles |
| Acompanhar obra, acompanhar ampliação, acompanhar lagoa | Acompanhar execução de obra |
| Responder notificação, responder intimação, tratar exigência | Responder notificação, intimação ou exigência |
| Ver hidrômetro, falta hidrômetro | Verificar hidrômetro e registrar demanda quando necessário |

## Matriz de compatibilidade sugerida

| Modalidade | Ações principais permitidas |
|---|---|
| Reunião técnica e alinhamento | alinhar; analisar; definir plano; orientar; negociar; apresentar feedback |
| Levantamento e diagnóstico | levantar dados; medir; diagnosticar; coletar evidências; identificar demandas |
| Visita e inspeção técnica | inspecionar; verificar; fotografar; registrar constatação; orientar |
| Acompanhamento operacional | conferir operação; revisar situação; monitorar; orientar; registrar demandas |
| Acompanhamento de obra | acompanhar execução; verificar avanço; comparar com projeto; orientar equipe; registrar evolução |
| Acompanhamento de vistoria ou fiscalização | acompanhar vistoria; apresentar informações; coletar evidências; registrar exigências |
| Diligência regulatória | consultar; protocolar; responder; negociar; cadastrar; obter documento; atualizar processo |
| Monitoramento periódico | monitorar; revisar registros; conferir prazo; atualizar status; registrar pendência |
| Treinamento e orientação | treinar; orientar; apresentar política ou procedimento; esclarecer dúvidas |
| Intervenção, implantação ou manutenção | limpar; instalar; corrigir; adequar; implantar melhoria; validar correção |

## Regras para o cadastro no sistema

1. O tipo de atendimento deve ser uma modalidade, nunca um tema isolado.
2. Toda ação deve começar com verbo no infinitivo.
3. A modalidade escolhida deve filtrar as ações disponíveis.
4. O tema técnico deve ser selecionado separadamente e pode ser múltiplo.
5. Constatações como “falta hidrômetro” devem gerar demanda, não um novo tipo.
6. Órgãos como SEMA, VISA, IBAMA e Bombeiros devem ser registrados como envolvidos, não como ações.
7. Resultado e status devem indicar o que aconteceu depois da ação.
8. Uma ação excepcional pode ser pesquisada fora do filtro, mas a combinação deve ficar marcada para revisão.
9. O título da visita pode ser sugerido usando modalidade, objetivo, tema principal e cliente.
10. Registros incompletos devem solicitar pelo menos ação e tema antes do encerramento.

## Termos que precisam de confirmação

Antes de transformar o catálogo em configuração definitiva, confirmar:

1. Se “CEMAT” é a sigla correta do órgão citado.
2. Qual licença foi pronunciada como “INS de consulte”.
3. Qual documento ou processo foi pronunciado como “a pitch de bombeiro”.
4. Se “helioposto” significa heliporto, heliponto ou outra instalação.
5. Se “limpeza da ETL” é uma ação executada pela equipe ou uma demanda acompanhada.
6. Qual era o objeto da anotação “aquisição”.

## Relação com o estudo do banco

Este catálogo complementa o documento `estudo-atendimentos-acoes.md`. A etapa seguinte é usar estas modalidades, ações e temas para classificar as 111 visitas já existentes e medir:

- frequência de cada modalidade;
- frequência de cada ação;
- temas mais recorrentes;
- combinações modalidade-ação realmente utilizadas;
- registros que permanecerem ambíguos;
- itens atuais que podem ser desativados ou consolidados.

As definições, finalidades, modelos de descrição e regras funcionais dos 12 tipos de atendimento estão consolidados em [`catalogo-tipos-atendimento.md`](./catalogo-tipos-atendimento.md). Esse documento deve ser adotado como referência funcional antes da implementação do catálogo no sistema. A estratégia definida é consolidar o cadastro existente: reaproveitar e renomear registros, migrar o histórico, desativar excedentes e criar o vínculo muitos-para-muitos entre tipos e ações, sem manter um catálogo paralelo.

Nenhum registro do banco remoto foi alterado durante esta consolidação. A migração e as alterações da aplicação foram preparadas localmente no repositório e aguardam aplicação no projeto Supabase correto.
