import type { IconDefinition } from "./catalog";

const STORAGE_KEY = "archflow:customIcons";
const OVERRIDES_KEY = "archflow:iconOverrides";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isSource = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  if (value.kind === "lucide") return true;
  if (value.kind === "iconify") return typeof value.id === "string";
  return value.kind === "upload" && typeof value.dataUrl === "string";
};

const isIconDefinition = (value: unknown): value is IconDefinition =>
  isRecord(value) && typeof value.ref === "string" && typeof value.name === "string" &&
  typeof value.category === "string" && Array.isArray(value.aliases) && isSource(value.source);

/** Itens criados pelo usuário; entradas corrompidas são descartadas em vez de quebrar a paleta. */
export const loadCustomIcons = (): IconDefinition[] => {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter(isIconDefinition) : [];
  } catch {
    return [];
  }
};

/** Personalizações de itens padrão (ex.: outro logo para "Browser"), por ref; entradas corrompidas são descartadas. */
export const loadIconOverrides = (): Record<string, IconDefinition> => {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(OVERRIDES_KEY) ?? "{}");
    if (!isRecord(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, IconDefinition] => isIconDefinition(entry[1])));
  } catch {
    return {};
  }
};

export const saveIconOverrides = (overrides: Record<string, IconDefinition>): boolean => {
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
    return true;
  } catch {
    return false;
  }
};

/** Devolve false se o navegador recusou (cota cheia, por exemplo, com uploads grandes). */
export const saveCustomIcons = (icons: readonly IconDefinition[]): boolean => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(icons));
    return true;
  } catch {
    return false;
  }
};

const slugify = (name: string): string =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";

/** @example customIconRef("Scaled Job", "a1b2") // "custom:scaled-job-a1b2" */
export const customIconRef = (name: string, suffix: string): string => `custom:${slugify(name)}-${suffix}`;
