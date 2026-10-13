// "y" da marca Arckyu: é o glifo original da Space Grotesk 700, sem alterar o desenho; muda só a cor
// (laranja) e a ponta da cauda (a barra de baixo, à esquerda) é pintada de creme.
// Contorno extraído com opentype.js de @fontsource/space-grotesk (latin-700), em unidades da fonte (1000/em),
// eixo y para baixo, linha de base em y=0. Fonte única do desenho: header, favicon e arquivos de logo.

export const Y_PATH =
  "M436 200L124 200L124 90L394 90Q422 90 422 60L422-65L404-65Q396-48 379-31Q362-14 333-3Q304 8 259 8Q201 8 157.5-18.5Q114-45 90-92Q66-139 66-200L66-496L192-496L192-210Q192-154 219.5-126Q247-98 298-98Q356-98 388-136.5Q420-175 420-244L420-496L546-496L546 88Q546 139 516 169.5Q486 200 436 200";

/** Caixa do glifo em unidades da fonte (x 66..546, y -496..200) e avanço/lateral para alinhar com o texto. */
export const Y_BOX = { x: 66, y: -496, width: 480, height: 696 };
export const Y_ADVANCE = 616;

/** Região da ponta da cauda (extremo esquerdo da barra de baixo). */
// Vai até onde a barra de baixo começa a curvar (x≈394 no contorno de cima); a curva continua laranja.
export const Y_TIP_CLIP = { x: 100, y: 84, width: 296, height: 130 };

// Borda da ponta no próprio laranja: a silhueta do "y" continua inteira e só o miolo da ponta fica creme.
export const Y_COLORS = { body: "#f76707", tip: "#fff4e6", tipEdge: "#f76707" };

/** Marcação SVG do "y" (sem a tag svg), com a ponta pintada; `clipId` precisa ser único no documento. */
// A borda da ponta fica recortada pelo próprio glifo: nada passa para fora da silhueta original da fonte.
export const yGlyphMarkup = (clipId: string): string =>
  `<defs><clipPath id="${clipId}-glyph"><path d="${Y_PATH}"/></clipPath>` +
  `<clipPath id="${clipId}"><rect x="${Y_TIP_CLIP.x}" y="${Y_TIP_CLIP.y}" width="${Y_TIP_CLIP.width}" height="${Y_TIP_CLIP.height}"/></clipPath></defs>` +
  `<path d="${Y_PATH}" fill="${Y_COLORS.body}"/>` +
  `<g clip-path="url(#${clipId}-glyph)"><path d="${Y_PATH}" fill="${Y_COLORS.tip}" stroke="${Y_COLORS.tipEdge}" stroke-width="22" stroke-linejoin="round" clip-path="url(#${clipId})"/></g>`;
