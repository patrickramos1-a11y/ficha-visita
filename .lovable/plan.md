# Armazenamento offline de fotos com upload automático

Hoje as fotos já são guardadas dentro do `pendingAtendimentos` como base64 no Dexie. Isso funciona mas tem dois problemas: ocupa ~33% mais espaço, e estoura o limite de 5MB do `localStorage` quando a sessão da visita ainda está em andamento (o `AtendimentoContext` salva tudo em `localStorage`). Vamos guardar as fotos como **Blobs** no IndexedDB e referenciá-las por id, tanto durante a visita quanto na fila de envio.

## O que muda

1. **Nova tabela `fotos` no Dexie** (`src/lib/offlineDB.ts`)
   - Schema: `fotoId` (uuid), `blob` (Blob), `mimeType`, `tipo` (`inicial|durante|final`), `createdAt`.
   - Utilitários: `savePhotoBlob(file|blob, tipo) → fotoId`, `getPhotoBlob(fotoId)`, `getPhotoObjectURL(fotoId)`, `deletePhoto(fotoId)`, `listOrphanPhotos()`.
   - Bump de versão do Dexie (v2) com migração que mantém os registros existentes.

2. **Tipo `Foto` passa a ser referência, não base64**
   - Em `src/types/atendimento.ts`, `fotos: { fotoId: string; tipo: 'inicial'|'durante'|'final'; remoteUrl?: string }[]`.
   - Componentes que exibem a foto (`FotoInicialOpcional`, `FotoFinalObrigatoria`, `ResumoAtendimento`, etc.) recebem a URL via um pequeno hook `usePhotoURL(fotoId)` que faz `URL.createObjectURL(blob)` e revoga no unmount.

3. **Captura de foto grava o Blob direto**
   - Em `FotoInicialOpcional.tsx` e `FotoFinalObrigatoria.tsx`, trocar o fluxo `FileReader → dataURL → addFoto(url)` por: pegar o `File` do input (câmera ou galeria) → `savePhotoBlob(file, tipo)` → `addFoto(fotoId, tipo)`.
   - O preview usa `URL.createObjectURL(file)` imediatamente; nada de base64.
   - `removeFoto` chama também `deletePhoto(fotoId)` para liberar espaço.

4. **`AtendimentoContext` deixa de carregar Blobs no `localStorage`**
   - Como agora `fotos[]` só guarda ids leves, o `JSON.stringify` da sessão volta a ser pequeno e seguro abaixo do limite do `localStorage`.
   - `resetAtendimento` apaga as fotos órfãs daquela sessão (`deletePhoto` para cada `fotoId` que não foi enfileirado num atendimento).

5. **Fila de envio referencia ids, sync sobe os Blobs**
   - `enqueueAtendimento` no `offlineDB.ts` continua igual, só que `data.fotos` já contém `fotoId` em vez de base64.
   - Em `src/lib/syncEngine.ts`, `pushAtendimento` faz, para cada foto:
     - `getPhotoBlob(fotoId)` → upload pro bucket `atendimento-fotos` (mesmo caminho de hoje) → `getPublicUrl` → insert em `atendimento_fotos`.
     - Se a foto já tiver `remoteUrl`, pula o upload (idempotência em retries).
   - Após o atendimento ser sincronizado com sucesso e removido da fila, todas as fotos referenciadas são apagadas do IndexedDB. Se falhar, ficam guardadas para o próximo retry.

6. **Limpeza de órfãos**
   - Na inicialização do `SyncProvider`, rodar `cleanupOrphanPhotos()`: apaga Blobs cuja `fotoId` não aparece em nenhum `pendingAtendimento` nem em `localStorage` da sessão ativa.

7. **Toast/feedback**
   - Sem mudança no comportamento do usuário: ao terminar a visita já aparece "Atendimento salvo no aparelho — será enviado quando houver internet". Quando o `syncEngine` envia com sucesso, o `SyncStatusBadge` já reflete `synced` e o `pendingCount` zera.

## Fora de escopo

- Compressão/resize automático de fotos (pode ser feito depois).
- Upload em paralelo / multipart resumível.
- Migração de fotos base64 que já estejam na fila atual de algum dispositivo (a fila vai ser drenada normalmente; só novas capturas usam Blob).

## Arquivos afetados

- `src/lib/offlineDB.ts` — nova tabela `fotos` + helpers, migração v2.
- `src/lib/syncEngine.ts` — leitura de Blob por `fotoId`, upload, marcação `remoteUrl`, limpeza pós-sync.
- `src/types/atendimento.ts` — novo formato de `fotos[]`.
- `src/contexts/AtendimentoContext.tsx` — `addFoto(fotoId, tipo)`, `removeFoto(fotoId)`, limpeza no reset.
- `src/pages/visita/FotoInicialOpcional.tsx` e `FotoFinalObrigatoria.tsx` — captura grava Blob, preview usa `objectURL`.
- `src/pages/visita/ResumoAtendimento.tsx` (e qualquer outro lugar que renderize `foto.url`) — usar `usePhotoURL(fotoId)`.
- `src/contexts/SyncContext.tsx` — chamar `cleanupOrphanPhotos()` no boot.
