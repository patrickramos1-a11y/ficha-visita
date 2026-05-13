## Objetivo

Permitir que o usuário selecione várias fotos da galeria simultaneamente em vez de uma por vez, tanto na etapa de Foto Inicial quanto na Foto Final.

## O que muda

Nas telas de upload de foto (`FotoInicialOpcional` e `FotoFinalObrigatoria`):

1. **Habilitar seleção múltipla** no input da galeria adicionando o atributo `multiple` (o input da câmera continua single, pois só faz uma foto por vez).
2. **Atualizar o handler `handleFileChange`** para iterar sobre `e.target.files` (FileList) em vez de pegar apenas `files[0]`, processando cada arquivo via `FileReader` e chamando `addFoto()` para cada um.
3. **Toast consolidado**: mostrar "X fotos adicionadas!" quando vier mais de uma, em vez de um toast por arquivo.
4. **Texto do botão**: ajustar o label de "Da Galeria" para deixar claro que aceita várias (ex.: "Da Galeria" continua, mas a descrição/instrução menciona seleção múltipla).

## Detalhes técnicos

- Arquivos afetados:
  - `src/pages/visita/FotoFinalObrigatoria.tsx`
  - `src/pages/visita/FotoInicialOpcional.tsx` (aplicar o mesmo padrão para consistência)
- Mudanças pontuais, sem alterar `AtendimentoContext`, schema ou lógica de armazenamento.
- O `addFoto` do contexto já suporta múltiplas chamadas em sequência.

## Fora de escopo

- Câmera nativa (capture) continua tirando uma foto por vez — limitação do `<input capture>`.
- Não vou mexer no componente `CameraCapture` (usado em outros fluxos).
- Sem compressão/redimensionamento adicional nesta tarefa.
