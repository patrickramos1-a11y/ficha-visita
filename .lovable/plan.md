# Visita Rápida (modo expresso)

Adicionar um segundo tipo de visita, mais curto, para situações onde o técnico só precisa registrar uma ação pontual (ex.: protocolar ofício na SEMMA) sem passar por todo o fluxo da visita completa.

A **visita completa** atual continua intacta. A **visita rápida** é um fluxo enxuto com 4 telas:

```
Início → Tipos → Cliente(s) → Responsável → Fotos → Resumo → Sucesso
```

Sem checklist, sem anotações, sem ações específicas, sem demandas, sem tópicos de reunião, sem foto inicial separada — tudo isso fica vazio no banco.

## 1. Escolha do tipo de visita

Nas telas iniciais (`src/pages/Index.tsx` mobile e `src/pages/desktop/IniciarVisita.tsx` desktop), o botão "Iniciar Visita" abre um seletor com duas opções:

- **Visita Completa** (atual) → vai para `/visita/foto-inicial`
- **Visita Rápida** → vai para `/visita/rapida/tipos`

Visualmente são dois cards lado a lado (ou empilhados no mobile) com ícone, título e uma linha curta explicando quando usar cada uma. O botão "Continuar Visita em Andamento" continua aparecendo igual quando há sessão ativa, independente do modo.

## 2. Marcador no contexto da visita

Em `src/contexts/AtendimentoContext.tsx` e `src/types/atendimento.ts`, adicionar:

- `modo: 'completa' | 'rapida'` em `AtendimentoData` (default `'completa'`).
- `iniciarVisita(modo)` — método que reseta e marca o modo. As telas iniciais passam a chamar isso ao invés de `resetAtendimento()` direto.

Isso permite o `RootRedirect` continuar mandando para a rota salva (visita rápida em andamento volta para onde parou).

## 3. Novas rotas e telas (mobile)

Criar 4 telas em `src/pages/visita/rapida/`:

- `TiposRapida.tsx` (`/visita/rapida/tipos`) — reutiliza a UI atual de `TiposAtendimento.tsx` (grid 2 colunas + busca já existente). Sem ações específicas no fim — vai direto para clientes.
- `ClientesRapida.tsx` (`/visita/rapida/clientes`) — reutiliza `SelecionarClientesFinal.tsx`.
- `ResponsavelRapida.tsx` (`/visita/rapida/responsavel`) — reutiliza `SelecionarResponsavel.tsx`.
- `FotosRapida.tsx` (`/visita/rapida/fotos`) — tela de fotos única (combina câmera + galeria, igual `FotoFinalObrigatoria.tsx`), com tipo `'durante'`. Mínimo 1 foto.
- O resumo final reusa `ResumoAtendimento.tsx` adaptado para esconder seções vazias (já esconde quando length=0; só falta esconder o título "Foto Inicial" e similares quando estiverem vazios — verificação rápida).

Para evitar duplicação grande, as telas `Tipos/Clientes/Responsavel` ganham uma prop opcional ou checam `data.modo === 'rapida'` para alterar:

- O `ProgressStepper` mostra um stepper menor (4 passos: Tipos → Clientes → Responsável → Fotos).
- O botão "Continuar" navega para a próxima rota da visita rápida em vez da rota da visita completa.

Implementação preferida: adicionar um helper `getNextRoute(currentStep, modo)` em um único lugar (`src/lib/visitFlow.ts` novo) que cada tela consulta. Mantém o código de cada página igual e só troca a navegação.

## 4. Stepper enxuto

Em `src/components/visita/ProgressStepper.tsx`, exportar um segundo array `VISIT_STEPS_RAPIDA` com 4 passos. As telas escolhem qual passar conforme `data.modo`.

## 5. Persistência e sincronização

Nada muda no `syncEngine.ts` nem no `offlineDB.ts`. A visita rápida é um `atendimento` normal; só vai com vários campos vazios. O `useSaveAtendimento` continua igual.

## 6. Visualização

- `Historico` (mobile e desktop) e `AtendimentoDetalhe` ganham um badge "Rápida" / "Completa" ao lado da data, baseado em quantos campos foram preenchidos (regra simples: sem checklist + sem anotações + sem demandas → "Rápida"). Não precisa migração de banco — derivamos no front.

## Arquivos afetados

- `src/types/atendimento.ts` — campo `modo`.
- `src/contexts/AtendimentoContext.tsx` — método `iniciarVisita(modo)`.
- `src/pages/Index.tsx`, `src/pages/desktop/IniciarVisita.tsx` — seletor de modo.
- `src/lib/visitFlow.ts` (novo) — mapa de navegação por modo.
- `src/components/visita/ProgressStepper.tsx` — `VISIT_STEPS_RAPIDA`.
- `src/pages/visita/rapida/TiposRapida.tsx`, `ClientesRapida.tsx`, `ResponsavelRapida.tsx`, `FotosRapida.tsx` (novos, finos — reutilizam componentes/lógica das telas completas).
- `src/App.tsx` — novas rotas.
- `src/pages/Historico.tsx`, `src/pages/desktop/Historico.tsx`, `src/pages/desktop/AtendimentoDetalhe.tsx` — badge do tipo (derivado).

## Fora de escopo

- Coluna `modo` no banco (derivado no front por enquanto).
- Editar uma visita finalizada para mudar de modo.
- Filtros por modo no histórico/dashboard (pode vir depois).
