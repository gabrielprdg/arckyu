import type { ArchCardData } from "../model/types";

export const CARD_SIZE = 84;
const ICON_RATIO = 52 / 84;
export type CardFonts = { label: number; caption: number };
export const DEFAULT_CARD_FONTS: CardFonts = { label: 16, caption: 12 };
const CAPTION_COLOR = "#868e96";

/** `caption`: linha(s) menores sob o nome, no estilo C4 ("[NestJS] API de produto"). */
export type CardSpec = {
  id: string; iconRef: string; name: string; frameColor: string; technology?: string; description?: string; caption?: string; x: number; y: number;
  fonts?: CardFonts;
  /** Lado do card em px (padrão 84); o ícone acompanha na mesma proporção. */
  size?: number;
};

const sizeOf = (spec: CardSpec): number => spec.size ?? CARD_SIZE;

const fontsOf = (spec: CardSpec): CardFonts => spec.fonts ?? DEFAULT_CARD_FONTS;
const LINE_HEIGHT = 1.4;

const captionSkeleton = (spec: CardSpec, group: string) =>
  spec.caption
    ? [{
        type: "text" as const, id: `${spec.id}-caption`, text: spec.caption, fontSize: fontsOf(spec).caption, textAlign: "center" as const,
        strokeColor: CAPTION_COLOR, x: spec.x, y: spec.y + sizeOf(spec) + 6 + fontsOf(spec).label * LINE_HEIGHT, groupIds: [group],
      }]
    : [];

/** Esqueletos (formato do convertToExcalidrawElements) de um card: moldura hand-drawn + ícone + rótulo, agrupados. */
export const cardSkeletons = <F extends string>(spec: CardSpec, fileIdFor: (iconRef: string) => F) => {
  const group = `g-${spec.id}`;
  const data: ArchCardData = { kind: "card", iconRef: spec.iconRef, technology: spec.technology ?? "", owner: "", description: spec.description ?? "" };
  const labelWidth = spec.name.length * fontsOf(spec).label * 0.55;
  const size = sizeOf(spec);
  const iconSize = Math.round(size * ICON_RATIO);
  const inset = (size - iconSize) / 2;
  return [
    {
      type: "rectangle" as const, id: spec.id, x: spec.x, y: spec.y, width: size, height: size,
      strokeColor: spec.frameColor, backgroundColor: "transparent", strokeWidth: 2, roughness: 1,
      roundness: { type: 3 as const }, groupIds: [group], customData: { archflow: data },
    },
    {
      type: "image" as const, id: `${spec.id}-icon`, fileId: fileIdFor(spec.iconRef),
      x: spec.x + inset, y: spec.y + inset, width: iconSize, height: iconSize, groupIds: [group],
    },
    {
      type: "text" as const, id: `${spec.id}-label`, text: spec.name, fontSize: fontsOf(spec).label, textAlign: "center" as const,
      x: spec.x + size / 2 - labelWidth / 2, y: spec.y + size + 6, groupIds: [group],
    },
    ...captionSkeleton(spec, group),
  ];
};

// "v3" = PNG com fundo claro em logo escuro (ver icons/rasterize.ts); versões anteriores são migradas no load.
export const ICON_FILE_PREFIX = "archflow-icon-v3-";
export const LEGACY_ICON_FILE_PREFIX = "archflow-icon-";

export const iconFileId = (iconRef: string): string => `${ICON_FILE_PREFIX}${iconRef.replace(/[^a-z0-9-]/gi, "-")}`;
