# Plano: Tópicos/Subtópicos via planilha + vínculo com Tipos/Ações

## Etapa 1 — Banco de dados (migração)

Adicionar vínculos opcionais nas configurações de Tipos e Ações:

- `tipos_atendimento_config`: novas colunas `topico_id uuid` e `subtopico_id uuid`.
- `acoes_especificas_config`: novas colunas `topico_id uuid` e `subtopico_id uuid`.

Ambas nullable (vínculo é opcional). Sem alterar RLS/grants existentes.

> Observação técnica: a tabela `subtopicos` já tem `topico_id` (subtópico pertence a um tópico). A planilha modelo tem tópicos (col G) e subtópicos (col H) como **listas separadas, sem vínculo entre si**. Decisão: ao importar, os subtópicos são criados sob um tópico genérico chamado `"(Importado)"` (criado automaticamente se não existir), preservando a estrutura atual do banco. O usuário poderá reorganizar manualmente depois se quiser.

## Etapa 2 — Importação da planilha em Configurações

Novo componente `ImportarTopicosSubtopicosCard` na aba Tópicos (e/ou na aba Subtópicos) de `desktop/Configuracoes.tsx`:

- Botão **"Importar da planilha modelo"** → abre file picker (`.xlsx`).
- Lê com `exceljs` a aba `Planilha2`, extrai valores não-vazios de:
  - **Coluna G** → tópicos
  - **Coluna H** → subtópicos
- Faz `trim` e deduplica (case-insensitive).
- Mostra `AlertDialog` de confirmação avisando que **todos os tópicos e subtópicos atuais serão substituídos** (mostra contagem: "X tópicos e Y subtópicos serão importados, substituindo os atuais").
- Ao confirmar, executa em sequência:
  1. `DELETE FROM subtopicos`
  2. `DELETE FROM topicos`
  3. Garante tópico `"(Importado)"`
  4. `INSERT` dos novos tópicos
  5. `INSERT` dos novos subtópicos vinculados ao tópico `"(Importado)"`
- Toast de sucesso e invalidação de queries `topicos`/`subtopicos`.
- Não toca em Planos, Origens, Status, Tipos, Ações, Demandas Específicas.

## Etapa 3 — Vínculo nas abas Tipos e Ações

Em `TiposAtendimentoCrud.tsx` e `AcoesEspecificasCrud.tsx`:

- Adicionar dois `Select` no formulário: **Tópico** e **Subtópico**.
- Subtópico filtra opções pelo `topico_id` selecionado (usa `useSubtopicos(topicoId)`).
- Salvar `topico_id` e `subtopico_id` no upsert.
- Mostrar o vínculo na lista (badge ou texto secundário).

Atualizar `useUpsertTipoAtendimento` e `useUpsertAcaoEspecifica` em `useConfigEntities.ts` para aceitar/persistir os dois novos campos. Ajustar selects das queries para incluir `topicos(nome), subtopicos(nome)`.

## Etapa 4 — Carregar vínculo durante a visita

- Ampliar o cache local (`tiposAcoesCache.ts`) para guardar também `topico` e `subtopico` (nomes) em cada tipo/ação.
- `useTiposAtendimentoConfig` e `useAcoesEspecificasConfig` passam a popular esses campos no cache.
- Não há nova UI durante a visita: os campos são apenas resolvidos no momento de gerar a planilha (transparente para o usuário, conforme pedido).

## Etapa 5 — Planilha gerada com Tópico/Subtópico vinculados

Em `src/lib/programacaoExport.ts`:

- Substituir as constantes `TOPICO_FIXO` e `SUBTOPICO_FIXO` por uma resolução por linha:
  1. Se a `Demanda` tem `tipo_atendimento` → buscar tópico/subtópico vinculados a esse tipo (via cache).
  2. Senão, se há ações específicas no atendimento e alguma tem vínculo → usar a primeira com vínculo.
  3. Fallback final: `"Sisramos"` / `"Visita"` (comportamento atual).
- Assinatura de `gerarProgramacaoXlsx` ganha `acoesEspecificas?: string[]` para o fallback por ação.
- `BaixarProgramacaoButton` passa `atendimento.acoes_especificas` (já disponível em `AtendimentoData`/`atendimentos`).

## Etapa 6 — Memória do projeto

Atualizar `mem://features/catalogo-demandas-especificas` (ou criar `mem://features/vinculo-topico-subtopico-tipos-acoes`) descrevendo:

- Tipos e Ações podem ter `topico_id`/`subtopico_id`.
- Importação de tópicos/subtópicos vem da `Planilha2` da planilha modelo (col G e H), substitui todos os existentes, subtópicos são vinculados ao tópico `"(Importado)"`.
- Geração do XLSX resolve Tópico/Subtópico por tipo da demanda → ação → fallback fixo.

## Arquivos

**Criados**
- `src/components/config/ImportarTopicosSubtopicosCard.tsx`
- `src/lib/importarTopicosSubtopicos.ts` (parser xlsx + execução do replace)

**Editados**
- `src/components/config/TiposAtendimentoCrud.tsx`
- `src/components/config/AcoesEspecificasCrud.tsx`
- `src/hooks/useConfigEntities.ts`
- `src/lib/tiposAcoesCache.ts`
- `src/types/tiposAtendimentoConfig.ts`
- `src/lib/programacaoExport.ts`
- `src/components/relatorio/BaixarProgramacaoButton.tsx`
- `src/pages/desktop/Configuracoes.tsx` (montar o card de importação na aba Tópicos)

**Migração**: adicionar `topico_id` e `subtopico_id` em `tipos_atendimento_config` e `acoes_especificas_config`.

## Fora de escopo

- Editor de planilha embutido.
- Atribuição automática de subtópicos aos tópicos corretos (não há essa relação na planilha modelo).
- Mudar o comportamento de download (continua nas mesmas telas: Sucesso/Histórico).