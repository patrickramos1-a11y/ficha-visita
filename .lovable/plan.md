# Exportação da planilha "Programação" com demandas da visita

## Objetivo
Ao concluir uma visita, gerar automaticamente uma cópia preenchida da planilha modelo "Programação - Modelo" com as demandas cadastradas, permitindo que o usuário baixe e edite manualmente antes de importar em outra plataforma.

## Onde fica o download
1. **Tela de Sucesso** (`src/pages/Sucesso.tsx`) — botão "Baixar Programação (.xlsx)" ao lado/abaixo do botão de PDF.
2. **Detalhe da visita** (`src/pages/desktop/AtendimentoDetalhe.tsx`) — mesmo botão, para baixar novamente depois.

## Mapeamento das colunas (por demanda × cliente)
A planilha modelo tem cabeçalho na linha 1 com 14 colunas. Para cada demanda da visita, gerar **uma linha por cliente selecionado**:

| Coluna | Origem do dado |
|---|---|
| Código | (vazio — usuário preenche depois) |
| Data | `data_inicio` da visita (formato data) |
| Ano / Mês | preservar as fórmulas já existentes do modelo (`=IF(B2<>"",YEAR(B2),"")` etc.) |
| Mês Inicial | (vazio) |
| Empresa | nome do cliente |
| Origem | `"VISITA / ATENDIMENTO"` (fixo) |
| Descrição | `descricao_detalhada` da demanda quando vier do catálogo; senão `descricao` (texto digitado) |
| Responsável | nome do responsável da visita |
| Plano | `demanda.plano` (VIP / Premium / Master / Integracao) |
| Status | `"EM_EXECUCAO"` (fixo, conforme valores da Planilha2) |
| Comentário | (vazio) |
| Tópico | nome do tópico vinculado à demanda (quando vier do catálogo) |
| Subtópico | nome do subtópico vinculado à demanda (quando vier do catálogo) |

Inclui **todas** as demandas (sugestões automáticas + personalizadas).

## Detalhes técnicos

### Template
- Copiar o arquivo enviado para `public/templates/programacao-modelo.xlsx`.
- Em runtime, fazer `fetch('/templates/programacao-modelo.xlsx')` → carregar com **ExcelJS** (`workbook.xlsx.load(arrayBuffer)`).
- ExcelJS preserva fórmulas, validações de dados (Planilha2) e formatação ao reescrever — é o que precisamos para que a planilha continue importável.

### Novo módulo `src/lib/programacaoExport.ts`
```ts
export async function gerarProgramacaoXlsx(
  atendimento: AtendimentoData,
  clientes: Cliente[],
  responsavel: Responsavel | undefined,
  demandasCatalogo: DemandaEspecificaConfig[] // para resolver Tópico/Subtópico
): Promise<Blob>
```
- Carrega o template, escreve linhas a partir da linha 2 em Sheet1 (preservando as fórmulas das colunas C/D que já existem até a linha 5055 — basta sobrescrever B com a Data e elas recalculam quando o Excel abrir).
- Para demandas vindas do catálogo, fazer lookup pelo `id` para obter `topicos.nome` e `subtopicos.nome`.
- Retorna `Blob` para download via `file-saver` (ou `URL.createObjectURL`).

### Hook auxiliar
`src/hooks/useDownloadProgramacao.ts` — encapsula carregar dados (clientes, responsável, catálogo) + chamar `gerarProgramacaoXlsx` + disparar download com nome `Programacao_<DataVisita>_<Cliente>.xlsx`.

### Dependências
- `exceljs` (~950 KB minified, lazy-importável)
- `file-saver`

### Edições
- `src/pages/Sucesso.tsx`: novo botão.
- `src/pages/desktop/AtendimentoDetalhe.tsx`: novo botão na seção de ações.
- `src/lib/programacaoExport.ts` (novo).
- `src/hooks/useDownloadProgramacao.ts` (novo).
- `public/templates/programacao-modelo.xlsx` (novo — cópia do arquivo enviado).

## Fora de escopo
- Editor de planilha dentro do app (usuário edita no Excel/Google Sheets).
- Envio automático para a outra plataforma.
- Preenchimento de Código, Comentário e Mês Inicial (ficam em branco).
