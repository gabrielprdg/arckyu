import type { IconDefinition } from "./catalog";

export const isCustomRef = (ref: string): boolean => ref.startsWith("custom:");

/** Catálogo padrão com as personalizações do usuário aplicadas por ref (ordem do catálogo preservada). */
export const applyOverrides = (catalog: readonly IconDefinition[], overrides: Readonly<Record<string, IconDefinition>>): IconDefinition[] =>
  catalog.map((icon) => overrides[icon.ref] ?? icon);

/** Substitui o item de mesmo ref; se não existir, acrescenta no fim. */
export const upsertByRef = (icons: readonly IconDefinition[], icon: IconDefinition): IconDefinition[] =>
  icons.some((item) => item.ref === icon.ref) ? icons.map((item) => (item.ref === icon.ref ? icon : item)) : [...icons, icon];

export const removeByRef = (icons: readonly IconDefinition[], ref: string): IconDefinition[] => icons.filter((item) => item.ref !== ref);

export const withoutKey = <T>(record: Readonly<Record<string, T>>, key: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([existing]) => existing !== key));

// djb2: hash curto e estável para versionar o arquivo de imagem quando o ícone de um item muda.
const shortHash = (text: string): string => {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  return hash.toString(36);
};

/**
 * Chave do arquivo de imagem: muda quando o ícone muda (o Excalidraw guarda a imagem por id e não a troca).
 * @example iconFileKey({ ref: "tech:sap", source: { kind: "iconify", id: "logos:sap" } }) // "tech:sap-1x2y3z"
 */
export const iconFileKey = (icon: Pick<IconDefinition, "ref" | "source">): string => `${icon.ref}-${shortHash(JSON.stringify(icon.source))}`;
