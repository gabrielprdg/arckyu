import { ICONIFY_API, ICONIFY_PREFIXES, iconifySvgUrl } from "./iconSource";

/** Subconjunto do fetch usado aqui; injetável para teste. */
export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

const SEARCH_LIMIT = 32;

const isSearchResponse = (value: unknown): value is { icons: string[] } =>
  typeof value === "object" && value !== null && "icons" in value && Array.isArray(value.icons);

/**
 * Busca ícones de logos/tecnologias no Iconify pelo nome do item.
 * @example await searchIconify("docker", { fetchFn: fetch }) // ["devicon:docker", "logos:docker-icon", ...]
 */
export const searchIconify = async (query: string, deps: { fetchFn: FetchLike; signal?: AbortSignal }): Promise<string[]> => {
  const term = query.trim();
  if (term.length < 2) return [];
  const params = new URLSearchParams({ query: term, limit: String(SEARCH_LIMIT), prefixes: ICONIFY_PREFIXES.join(",") });
  const response = await deps.fetchFn(`${ICONIFY_API}/search?${params}`, { signal: deps.signal });
  if (!response.ok) throw new Error(`busca no Iconify falhou para "${term}": HTTP ${response.status}`);
  const body = await response.json();
  if (!isSearchResponse(body)) throw new Error(`resposta inesperada do Iconify para "${term}": esperado { icons: string[] }`);
  return body.icons;
};

export const fetchIconifySvg = async (iconifyId: string, deps: { fetchFn: FetchLike; color?: string }): Promise<string> => {
  const response = await deps.fetchFn(iconifySvgUrl(iconifyId, { height: 128, color: deps.color }));
  if (!response.ok) throw new Error(`ícone "${iconifyId}" não carregou: HTTP ${response.status}`);
  return response.text();
};
