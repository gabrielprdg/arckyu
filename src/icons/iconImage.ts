import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IconDefinition } from "./catalog";
import { categoryStyle } from "./categoryStyle";
import { getIconComponent } from "./iconComponents";
import { fetchIconifySvg, type FetchLike } from "./iconifyClient";

export const TILE_SIZE = 64;
const GLYPH_SIZE = 34;

/**
 * Envolve o SVG do glifo num "azulejo" colorido por categoria (estilo dos pacotes oficiais de cloud).
 * @example wrapTileSvg("<svg/>", "#f97316")
 */
export const wrapTileSvg = (glyphSvg: string, color: string): string => {
  const offset = (TILE_SIZE - GLYPH_SIZE) / 2;
  const glyph = glyphSvg.replace("<svg", `<svg x="${offset}" y="${offset}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE_SIZE}" height="${TILE_SIZE}" viewBox="0 0 ${TILE_SIZE} ${TILE_SIZE}">` +
    `<rect x="2" y="2" width="${TILE_SIZE - 4}" height="${TILE_SIZE - 4}" rx="12" fill="${color}"/>${glyph}</svg>`;
};

export const svgToDataUrl = (svg: string): string =>
  `data:image/svg+xml;base64,${btoa(String.fromCodePoint(...new TextEncoder().encode(svg)))}`;

type IconBasics = Pick<IconDefinition, "ref" | "category">;

export const lucideTileDataUrl = (icon: IconBasics): string => {
  const glyph = renderToStaticMarkup(createElement(getIconComponent(icon.ref, icon.category), { size: GLYPH_SIZE, color: "#ffffff", strokeWidth: 1.8 }));
  return svgToDataUrl(wrapTileSvg(glyph, categoryStyle(icon.category).tile));
};

const loadIconify = async (icon: IconDefinition, iconifyId: string, fetchFn: FetchLike): Promise<string> => {
  try {
    return svgToDataUrl(await fetchIconifySvg(iconifyId, { fetchFn, color: categoryStyle(icon.category).tile }));
  } catch {
    // Sem rede ou ícone removido do Iconify: o card continua com o glifo genérico da categoria.
    return lucideTileDataUrl(icon);
  }
};

const cache = new Map<string, Promise<string>>();

const cacheKey = (icon: IconDefinition): string =>
  `${icon.ref}|${icon.source.kind === "iconify" ? icon.source.id : icon.source.kind}`;

/**
 * Data URL da imagem que vai para o canvas: upload como veio, logo do Iconify ou glifo em azulejo.
 * @example await resolveIconDataUrl(dockerIcon, { fetchFn: fetch })
 */
export const resolveIconDataUrl = (icon: IconDefinition, deps: { fetchFn: FetchLike }): Promise<string> => {
  const source = icon.source;
  if (source.kind === "upload") return Promise.resolve(source.dataUrl);
  if (source.kind === "lucide") return Promise.resolve(lucideTileDataUrl(icon));
  const key = cacheKey(icon);
  const cached = cache.get(key) ?? loadIconify(icon, source.id, deps.fetchFn);
  cache.set(key, cached);
  return cached;
};
