# Tipos e Ações configuráveis

Hoje os "Tipos de Atendimento" e "Ações Específicas" estão fixos no arquivo `src/types/tiposAtendimentoConfig.ts`. O objetivo é movê-los para o banco de dados, com CRUD completo (criar, editar nome/descrição/plano, ativar/desativar, apagar) acessível pelas Configurações — exatamente no mesmo padrão das outras abas (Empresas, Responsáveis, Planos, Tópicos, Demandas).

## 1. Banco de dados

Criar duas novas tabelas:

- **`tipos_atendimento_config`**
  - `nome` (texto, único)
  - `descricao` (texto, opcional)
  - `plano_id` (referência a `planos`, opcional)
  - `ativo` (boolean, default true)

- **`acoes_especificas_config`**
  - `nome` (texto, único)
  - `plano_id` (referência a `planos`, opcional)
  - `ativo` (boolean, default true)

Políticas de acesso público (mesmo padrão das demais tabelas de configuração).

**Seed:** popular as duas tabelas com os 11 tipos e 10 ações já existentes em `tiposAtendimentoConfig.ts`, vinculando ao plano correspondente (procurando o `id` na tabela `planos` por nome).

**Conversão de enum para texto:** as colunas `atendimentos.tipos_atendimento` (hoje `atendimento_tipo[]`) e `demandas.tipo_atendimento` (hoje enum) precisam virar `text[]` e `text` respectivamente — caso contrário, novos tipos criados pelo usuário não poderão ser salvos. Conversão preserva todos os dados existentes.

## 2. Hooks de dados

Adicionar em `src/hooks/useConfigEntities.ts`:
- `useTiposAtendimentoConfig`, `useUpsertTipoAtendimento`, `useDeleteTipoAtendimento`
- `useAcoesEspecificasConfig`, `useUpsertAcaoEspecifica`, `useDeleteAcaoEspecifica`

## 3. UI de Configurações (desktop)

Em `src/pages/desktop/Configuracoes.tsx`, adicionar duas novas abas:
- **Tipos** — CRUD com campos: nome, descrição, plano (select).
- **Ações** — CRUD com campos: nome, plano (select).

Reaproveitar o estilo dos componentes existentes (similar ao `DemandasEspecificasCrud`).

## 4. Substituir uso do arquivo estático

`src/types/tiposAtendimentoConfig.ts` deixa de ser fonte de verdade. As telas que hoje importam dele passam a consumir os hooks:

- `src/pages/visita/TiposAtendimento.tsx`
- `src/pages/visita/AcoesEspecificas.tsx`
- `src/pages/visita/rapida/TiposRapida.tsx`
- `src/pages/visita/ResumoAtendimento.tsx`
- `src/pages/desktop/AtendimentoDetalhe.tsx`
- `src/components/relatorio/GerarPDF.tsx`
- `src/lib/syncEngine.ts` (função `getPlanoFromTipo` vira lookup em cache local)
- `src/contexts/AtendimentoContext.tsx`

Para offline: os tipos e ações são leves e ficam em cache do React Query — também serão persistidos em IndexedDB (junto com clientes e responsáveis que já têm esse padrão) para funcionarem sem internet.

## 5. Tipo TypeScript

Em `src/types/atendimento.ts`, `AtendimentoTipo` deixa de ser união literal fechada e passa a ser `string` (já que agora é dinâmico). O enum `TIPOS_ATENDIMENTO` exportado é removido.

## Detalhes técnicos

- Migração SQL faz `ALTER TYPE` indireto: cria coluna `text[]` nova, copia dados convertidos, dropa antiga, renomeia.
- `getPlanoFromTipo`/`getPlanoFromAcao` viram funções que recebem a lista carregada do cache em vez de consultar o array estático.
- Visitas antigas com tipos que foram apagados continuam exibindo o nome salvo (apenas sem cor/descrição associada).

## Resultado

Após aprovação, o usuário poderá entrar em **Configurações → Tipos / Ações** e gerenciar livremente: criar novos itens, renomear, alterar descrição/plano, desativar ou apagar — e essas mudanças aparecem imediatamente nas telas de visita (completa e rápida), no resumo, no histórico e no PDF.
