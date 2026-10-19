# Política de conformidade binária

## Decisão

Os controles avaliativos da Ficha de Visita passam a admitir somente dois resultados com pontuação:

- **Conforme / Sim**: condição aceitável, atendida ou resolvida.
- **Não conforme / Não**: condição que exige correção, providência ou acompanhamento.

O estado **N/A** permanece disponível exclusivamente quando o controle não se aplica ao contexto da visita. Ele não entra no cálculo de conformidade.

## Estados removidos

Os estados `Parcial`, `Atenção`, `Pontual` e `Avaliar` deixam de ser oferecidos como resultados intermediários. Quando encontrados em registros históricos, são interpretados e migrados como **Não conforme**, pois representam uma condição ainda não plenamente atendida.

## Aplicação

A regra vale para:

- acompanhamento de obras;
- acompanhamento ambiental;
- fichas personalizadas;
- inspeção PCA;
- indicadores do histórico;
- relatórios digitais;
- PDFs;
- resumos por módulo e alertas.

O acompanhamento de processos mantém seus estados processuais próprios, como aguardando análise, deferido e indeferido. Esses estados descrevem andamento administrativo e não são resultados de conformidade.

## Cálculo

- Conforme: 100 pontos.
- Não conforme: 0 pontos.
- N/A: excluído do cálculo.

Não existe pontuação intermediária. A porcentagem representa a proporção de controles conformes entre todos os controles efetivamente avaliados.

## Compatibilidade histórica

| Resposta antiga | Resposta canônica |
| --- | --- |
| `PARCIALMENTE` | `NAO` |
| `PARCIAL` | `NAO_CONFORME` |
| `REQUER_ATENCAO` | `NAO_CONFORME` |
| `ATENCAO` | `NAO_CONFORME` |
| `AVALIAR` | `NAO_CONFORME` |

Os percentuais consolidados de visitas afetadas devem ser invalidados e recalculados com a regra binária.
