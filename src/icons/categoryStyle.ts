import type { IconCategory } from "../model/types";

export type CategoryStyle = { label: string; tile: string };

// Cores por categoria, no espírito das paletas oficiais de cloud (compute laranja, banco magenta...).
const KNOWN: Record<string, CategoryStyle> = {
  client: { label: "Clientes", tile: "#3b82f6" },
  network: { label: "Rede e borda", tile: "#8b5cf6" },
  compute: { label: "Compute", tile: "#f97316" },
  database: { label: "Bancos e cache", tile: "#d946ef" },
  messaging: { label: "Mensageria", tile: "#ec4899" },
  storage: { label: "Storage", tile: "#22c55e" },
  security: { label: "Segurança", tile: "#ef4444" },
  container: { label: "Containers", tile: "#0ea5e9" },
};

const CUSTOM_TILE = "#868e96";

export const CATEGORY_ORDER: readonly IconCategory[] = Object.keys(KNOWN);

/** Categoria criada pelo usuário usa o próprio nome como rótulo e uma cor neutra. */
export const categoryStyle = (category: IconCategory): CategoryStyle => KNOWN[category] ?? { label: category, tile: CUSTOM_TILE };

export const isKnownCategory = (category: IconCategory): boolean => category in KNOWN;
