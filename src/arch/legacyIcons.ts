import { ICON_FILE_PREFIX, LEGACY_ICON_FILE_PREFIX } from "./cardFactory";

type ImageLike = { type: string; isDeleted: boolean; fileId?: string | null };

// "archflow-icon-" + versão opcional ("v2-") + ref. Sem versão = SVG original; v2 = PNG sem fundo para logo escuro.
const VERSIONED_ID = /^archflow-icon-(?:v\d+-)?(.+)$/;

const upgradeId = (fileId: string): string | null => {
  if (!fileId.startsWith(LEGACY_ICON_FILE_PREFIX) || fileId.startsWith(ICON_FILE_PREFIX)) return null;
  const ref = VERSIONED_ID.exec(fileId)?.[1];
  return ref ? ICON_FILE_PREFIX + ref : null;
};

/**
 * Ícones salvos em versões anteriores → id da versão atual (re-rasterizado no load).
 * @example planLegacyIconMigration(elements) // Map { "archflow-icon-v2-tech-kafka" => "archflow-icon-v3-tech-kafka" }
 */
export const planLegacyIconMigration = (elements: readonly ImageLike[]): Map<string, string> =>
  new Map(elements.flatMap((el) => {
    const fileId = el.type === "image" && !el.isDeleted ? el.fileId : null;
    const next = fileId ? upgradeId(fileId) : null;
    return fileId && next ? [[fileId, next] as const] : [];
  }));
