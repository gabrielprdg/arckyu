/** De onde vem o desenho do ícone: glifo genérico, logo do Iconify ou arquivo enviado pelo usuário. */
export type IconSource =
  | { kind: "lucide" }
  | { kind: "iconify"; id: string }
  | { kind: "upload"; dataUrl: string };

export const ICONIFY_API = "https://api.iconify.design";

// Coleções de logos com licença aberta: Logos (CC0), Devicon (MIT), Simple Icons (CC0), Skill Icons (MIT).
export const ICONIFY_PREFIXES = ["logos", "devicon", "simple-icons", "skill-icons"] as const;

/** Simple Icons é monocromático (currentColor); os outros já vêm coloridos. */
export const isMonochrome = (iconifyId: string): boolean => iconifyId.startsWith("simple-icons:");

/**
 * URL do SVG no Iconify; `color` só tem efeito em coleções monocromáticas.
 * @example iconifySvgUrl("logos:docker-icon", { height: 128 }) // "https://api.iconify.design/logos/docker-icon.svg?height=128"
 */
export const iconifySvgUrl = (iconifyId: string, options: { height?: number; color?: string } = {}): string => {
  const [prefix, name] = iconifyId.split(":");
  if (!prefix || !name) throw new Error(`id do Iconify inválido: esperado "colecao:nome", recebido "${iconifyId}"`);
  const params = new URLSearchParams();
  if (options.height) params.set("height", String(options.height));
  if (options.color && isMonochrome(iconifyId)) params.set("color", options.color);
  const query = params.toString();
  return `${ICONIFY_API}/${prefix}/${name}.svg${query ? `?${query}` : ""}`;
};
