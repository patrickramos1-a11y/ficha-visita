# Implementação PWA — Ficha de Visita Consultoria

## Objetivo

Tornar o app instalável no celular como aplicativo, com ícone próprio, abertura em modo standalone (sem barra do navegador), funcionamento offline básico via cache e banner discreto convidando à instalação.

## Aviso importante (obrigatório informar ao usuário)

PWA com Service Worker **não funciona corretamente dentro do preview do Lovable** (iframe). A instalação, o ícone na home, o modo standalone e o cache offline só vão funcionar de verdade na **versão publicada** (`https://site-log-buddy.lovable.app` ou domínio próprio). No editor isto será desabilitado de propósito para evitar caches antigos atrapalhando o desenvolvimento.

## Identidade do app

- `name`: "Ficha de Visita — Consultoria"
- `short_name`: "Ficha de Visita"
- `theme_color`: verde Ramos `#1DB954` (cor primária já usada)
- `background_color`: `#FAFAFA` (igual ao `--background` light)
- `display`: `standalone`
- `start_url`: `/`
- `scope`: `/`
- `orientation`: `portrait`

## Alterações

### 1. Gerar ícones do app

Gerar 3 PNGs para `public/` a partir de uma arte simples coerente com o app (símbolo de prancheta/ficha + check em verde Ramos sobre fundo claro):

- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)
- `public/icon-maskable-512.png` (512×512, com safe-area para Android adaptive icons)
- `public/apple-touch-icon.png` (180×180, para iOS na home)

Os ícones serão gerados via script no sandbox (ImageMagick / sharp). Visual: fundo claro arredondado, monograma "FV" ou ícone de ficha com check, em verde `#1DB954`.

### 2. Configurar `vite-plugin-pwa` (já está nas deps)

Atualizar `vite.config.ts`:

- Importar `VitePWA`
- `registerType: "autoUpdate"`
- `devOptions: { enabled: false }` — service worker NUNCA roda em dev/preview
- `workbox`:
  - `navigateFallback: "/index.html"` (SPA funciona offline com a última versão)
  - `navigateFallbackDenylist: [/^\/~oauth/, /^\/api/]`
  - `runtimeCaching`:
    - HTML navigations → `NetworkFirst` (timeout 3s) — evita app travado em versão velha
    - JS/CSS/imagens (`same-origin`, `script|style|image|font`) → `StaleWhileRevalidate`
    - Supabase REST/Storage → `NetworkFirst` com cache curto (assim sem internet o app abre com últimos dados, mas atualiza ao voltar online)
- `manifest` com os campos da seção "Identidade" + array `icons` apontando para os 4 PNGs (incluindo `purpose: "maskable"` no maskable e `purpose: "any"` nos demais)

### 3. Guard de registro do Service Worker

Em `src/main.tsx`, antes de renderizar:

- Detectar se está em iframe (`window.self !== window.top`) ou em host de preview (`id-preview--*` / `lovableproject.com`)
- Se sim: desregistrar qualquer SW existente e **não** importar `virtual:pwa-register`
- Se não (produção real): importar `virtual:pwa-register` e chamar `registerSW({ immediate: true })`

Isso evita os problemas conhecidos de SW dentro do preview do Lovable (cache stale, conteúdo travado).

### 4. Meta tags em `index.html`

Atualizar `<head>`:

- `<title>Ficha de Visita — Consultoria</title>`
- `<meta name="description" content="Registre visitas técnicas e atendimentos de consultoria, mesmo offline." />`
- `<meta name="theme-color" content="#1DB954" />`
- `<meta name="apple-mobile-web-app-capable" content="yes" />`
- `<meta name="apple-mobile-web-app-status-bar-style" content="default" />`
- `<meta name="apple-mobile-web-app-title" content="Ficha de Visita" />`
- `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`
- Atualizar `og:title` e remover TODOs

O `<link rel="manifest">` é injetado automaticamente pelo `vite-plugin-pwa`.

### 5. Banner de instalação

Criar `src/components/pwa/InstallPromptBanner.tsx`:

- Escuta o evento `beforeinstallprompt` no `window`, chama `e.preventDefault()` e guarda o evento em state
- Só mostra se: evento capturado **e** o app **não** está rodando em modo standalone (`window.matchMedia('(display-mode: standalone)').matches` falso) **e** o usuário ainda não dispensou nesta sessão (`sessionStorage.getItem('pwa-install-dismissed')` ausente)
- Visual: faixa fixa no rodapé (`fixed bottom-0`, respeitando `safe-bottom`), card com borda superior, sombra sutil, mesma paleta do app (bg `card`, texto `foreground`, botão primário verde Ramos)
- Texto: "Instale o app para acessar suas fichas a qualquer momento, mesmo sem internet."
- Botões:
  - **Instalar agora** (`variant="default"`): chama `prompt.prompt()`, aguarda `userChoice`, esconde o banner depois e marca `sessionStorage`
  - **Agora não** (`variant="ghost"`): esconde o banner e marca `sessionStorage.setItem('pwa-install-dismissed', '1')`
- Em iOS (Safari, sem `beforeinstallprompt`): mostrar variante alternativa só se for iOS + Safari + não-standalone, com instrução curta "Toque em Compartilhar e depois 'Adicionar à Tela de Início'." (mesmo botão "Agora não" para fechar)

Renderizar `<InstallPromptBanner />` uma vez em `src/App.tsx` dentro do `BrowserRouter`, fora do `<Routes>`, para aparecer em qualquer página.

## Detalhes técnicos

```
src/
  main.tsx                       # guard + registerSW condicional
  App.tsx                        # monta <InstallPromptBanner />
  components/pwa/
    InstallPromptBanner.tsx      # novo
public/
  icon-192.png                   # novo
  icon-512.png                   # novo
  icon-maskable-512.png          # novo
  apple-touch-icon.png           # novo
index.html                       # meta tags PWA + título
vite.config.ts                   # VitePWA(...)
```

Comportamento esperado após publicar:

```
Acesso 1 (online)   -> SW instala, faz cache do shell + assets
Acesso 2 (offline)  -> App abre normalmente com última versão em cache
Volta online        -> NetworkFirst busca novos dados; autoUpdate troca SW
Chrome Android      -> beforeinstallprompt -> banner -> instala como app
iOS Safari          -> banner com instrução manual (Adicionar à Tela)
Já instalado        -> display-mode: standalone -> banner não aparece
"Agora não"         -> sessionStorage flag -> banner não volta na sessão
```

Não haverá alterações no fluxo de visita, na persistência em `localStorage` já existente, nem no backend.

