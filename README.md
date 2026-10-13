# Arckyu

Marca: "Arckyu" em Space Grotesk com o "y" laranja e a ponta da cauda creme (`src/brand/yGlyph.ts` é a fonte do desenho;
`npm run icons` gera `public/arckyu-wordmark*.svg`, favicon e PNGs).
Os desenhos ficam no IndexedDB do navegador (banco `arckyu`). O desenho único da versão antiga (`archflow:scene`) é migrado
uma vez para "Meus desenhos"; as chaves antigas ficam no navegador como rede de segurança.

Excalidraw + arquitetura: whiteboard completo do Excalidraw com uma camada de
arquitetura por cima (cards com ícone, propriedades, fluxo animado e modo play).

## Login e nuvem (Supabase)

- Rotas: `/` landing, `/entrar` login (Google/GitHub), `/app` editor (exige conta), `/termos`, `/privacidade`.
- Copie `.env.example` para `.env.local` com a URL e a publishable key do projeto (nunca a service_role).
- Aplique `supabase/migrations/20261012000000_drawings.sql` no projeto (SQL Editor ou `supabase db push`): tabelas
  `collections`, `drawings`, `drawing_contents` com RLS (cada usuário só vê os próprios desenhos).
- Em produção o host precisa reescrever qualquer caminho para `index.html` (SPA) e o domínio entra nas Redirect URLs do Supabase.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5180
npm test         # vitest (grafo da cena, path das setas, animação, cenário, player, busca)
npm run build    # typecheck + build de produção
```

## Como funciona

- **Base = Excalidraw** (`@excalidraw/excalidraw` 0.18): formas, texto, caneta, hand-drawn,
  frames, undo/redo, export PNG/SVG/JSON e biblioteca, tudo nativo.
- **Card** = moldura hand-drawn + ícone (SVG gerado do lucide) + rótulo, agrupados; os dados
  de arquitetura (ícone, tecnologia, responsável, descrição) ficam em `customData.archflow`.
- **Conexão** = seta nativa. Seta ligando dois cards já nasce animada; tracejado = assíncrono.
  Direção, velocidade e pacotes ficam no `customData` da seta (inspetor à direita).
- **Camada animada** (`src/overlay/FlowOverlay.tsx`) = SVG transparente sobre o canvas, em
  coordenadas de cena (`scale(zoom) translate(scrollX, scrollY)`). No tema escuro recebe o mesmo
  filtro do canvas do Excalidraw.
- **Modo play** = esmaece a cena, acende os cards do caminho e leva um pacote passo a passo.
- **Gravar cenário** = selecione os cards na ordem; saltos são preenchidos pelo menor caminho.
- `Alt+P` pausa todas as animações (P sozinho é a caneta do Excalidraw).
- **Ícones reais**: tecnologias e AWS usam logos do [Iconify](https://iconify.design) (coleções Logos/CC0,
  Devicon/MIT, Simple Icons/CC0, Skill Icons/MIT). Sem rede, o card cai no glifo genérico da categoria.
- **Novo item** (botão `+` na paleta, ou "Criar “…”" quando a busca não acha): nome, categoria (existente
  ou nova), apelidos e ícone. O ícone é buscado pelo nome no Iconify; se não houver, upload (SVG/PNG/JPG/WebP
  até 512 KB) ou glifo genérico. Itens ficam salvos no navegador (`archflow:customIcons`).
- **Tema claro/escuro** na barra (também sincroniza com o menu do Excalidraw).
- **Fontes**: as 4 atuais do Excalidraw + Virgil, Helvetica e Cascadia (`showDeprecatedFonts`).
- **Meus desenhos** (botão com o nome do desenho, na barra): vários desenhos, cada um com os próprios cenários do play;
  coleções, busca, novo (em branco ou de um modelo), renomear, mover, duplicar e apagar. Salva sozinho ao editar
  (`src/drawings/`); a interface `DrawingStore` é o ponto de troca para o Supabase na fase de nuvem.
- **Modelos** (seletor "Modelos…" na barra, cria um desenho novo): diagramas prontos definidos em `src/arch/templates/` como dados
  (cards, setas, fronteiras, textos e cenários). Hoje: exemplo serverless e **Loja Nimbus** (e-commerce
  fictício na AWS, C4 de containers, 8 cenários de play).
- **Cenários**: o play toca o cenário escolhido na lista; "Gravar cenário" adiciona um novo à lista.
- **Exportar animação** (barra): a animação de fundo (bolinhas/traço) ou o play de um cenário, como vídeo MP4
  (WebM se o navegador não tiver H.264; Full HD ou 4K, tema claro/escuro) ou SVG animado em loop (SMIL, abre no navegador e
  no GitHub). Tudo no navegador: fundo via `exportToCanvas`/`exportToSvg` do Excalidraw + camada pintada quadro a quadro
  (`src/export/`), vídeo codificado com [Mediabunny](https://mediabunny.dev) (MPL-2.0).
- **Fronteiras (C4)** são retângulos tracejados, não frames: frame do Excalidraw corta as setas que cruzam a borda.

## Estrutura

```
src/arch/     customData, grafo da cena, path das setas, fábrica de cards, exemplo, adaptador da API
src/overlay/  camada SVG: formigas, pacotes, pacote do play, brilho dos cards
src/flow/     matemática da animação, cenário (BFS), reducer do player, rAF
src/app/      hooks: snapshot da cena, play, gravação, inserção, persistência
src/ui/       toolbar, paleta, inspetor
src/icons/    catálogo, busca, cores por categoria
src/drawings/ Meus desenhos: armazenamento (IndexedDB/memória), biblioteca, autosave, miniaturas
src/export/   export de animação: linha do tempo, pintor em canvas, SVG animado, encoder de vídeo
```

A versão anterior com React Flow está no primeiro commit (`git log`).

## Ainda não tem

GIF animado, renomear/apagar cenário gravado,
fontes além das que o Excalidraw embute, colaboração, drill-down e modo tarefas.
