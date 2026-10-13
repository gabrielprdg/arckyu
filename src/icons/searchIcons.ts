import type { IconDefinition } from "./catalog";

const normalize = (text: string): string =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const matchesQuery = (icon: IconDefinition, query: string): boolean =>
  [icon.name, icon.ref, ...icon.aliases].some((term) => normalize(term).includes(query));

/**
 * Filtra o catálogo por nome, ref ou alias, ignorando acento e caixa.
 * @example searchIcons(ICON_CATALOG, "pg") // → [PostgreSQL]
 */
export const searchIcons = (
  catalog: readonly IconDefinition[],
  rawQuery: string,
): IconDefinition[] => {
  const query = normalize(rawQuery);
  if (query === "") return [...catalog];
  return catalog.filter((icon) => matchesQuery(icon, query));
};
