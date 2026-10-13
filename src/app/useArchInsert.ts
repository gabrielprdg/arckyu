import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback } from "react";
import { BOUNDARIES, type BoundaryKind } from "../arch/boundaries";
import { CARD_SIZE, cardSkeletons } from "../arch/cardFactory";
import { clientToScene, iconFile, insertElements, sceneCenter, toElements, toFileId } from "../arch/excalidrawAdapter";
import type { IconDefinition } from "../icons/catalog";
import { categoryStyle } from "../icons/categoryStyle";
import { resolveIconDataUrl } from "../icons/iconImage";
import { iconFileKey } from "../icons/libraryOps";
import { toCanvasImage } from "../icons/rasterize";

export const PALETTE_MIME = "application/archflow";

export type PaletteItem = { kind: "component"; ref: string } | { kind: "boundary"; boundary: BoundaryKind };

const newId = (): string => crypto.randomUUID().slice(0, 8);

const isPaletteItem = (value: unknown): value is PaletteItem => {
  if (typeof value !== "object" || value === null || !("kind" in value)) return false;
  if (value.kind === "component") return "ref" in value && typeof value.ref === "string";
  return value.kind === "boundary" && "boundary" in value;
};

export const parsePaletteItem = (raw: string): PaletteItem | null => {
  try {
    const item: unknown = JSON.parse(raw);
    return isPaletteItem(item) ? item : null;
  } catch {
    return null;
  }
};

const FRAME_SIZE = { width: 480, height: 320 };
const browserFetch = (url: string, init?: { signal?: AbortSignal }) => fetch(url, init);

// Retângulo tracejado + rótulo (agrupados), não frame: frame do Excalidraw corta as setas que cruzam a borda.
const insertBoundary = (api: ExcalidrawImperativeAPI, boundary: BoundaryKind, at: { x: number; y: number }): void => {
  const name = BOUNDARIES.find((b) => b.kind === boundary)?.defaultName ?? boundary;
  const id = `boundary-${newId()}`;
  const x = at.x - FRAME_SIZE.width / 2;
  const y = at.y - FRAME_SIZE.height / 2;
  const box = {
    type: "rectangle" as const, id, x, y, ...FRAME_SIZE, strokeColor: "#868e96", backgroundColor: "transparent",
    strokeStyle: "dashed" as const, strokeWidth: 1, roughness: 1, roundness: { type: 3 as const }, groupIds: [`g-${id}`],
  };
  const label = { type: "text" as const, id: `${id}-name`, text: name, x: x + 12, y: y - 26, fontSize: 16, strokeColor: "#868e96", groupIds: [`g-${id}`] };
  insertElements(api, toElements([box, label]), []);
};

/** Card com o ícone já resolvido (logo do Iconify pode levar alguns ms para chegar). */
export const insertCard = async (api: ExcalidrawImperativeAPI, icon: IconDefinition, at: { x: number; y: number }): Promise<void> => {
  const dataUrl = await toCanvasImage(await resolveIconDataUrl(icon, { fetchFn: browserFetch }));
  const spec = { id: `card-${newId()}`, iconRef: icon.ref, name: icon.name, frameColor: categoryStyle(icon.category).tile, x: at.x - CARD_SIZE / 2, y: at.y - CARD_SIZE / 2 };
  // Arquivo versionado pelo ícone: item editado na paleta gera imagem nova em vez de reaproveitar a antiga.
  const fileKey = iconFileKey(icon);
  insertElements(api, toElements(cardSkeletons(spec, () => toFileId(fileKey))), [iconFile(fileKey, dataUrl)]);
};

/** Insere cards e agrupadores (frames) na cena do Excalidraw, no centro da tela ou onde foi solto. */
export const useArchInsert = (api: ExcalidrawImperativeAPI | null, findIcon: (ref: string) => IconDefinition | undefined) => {
  const insertAt = useCallback((item: PaletteItem, at: { x: number; y: number }) => {
    if (!api) return;
    if (item.kind === "boundary") return insertBoundary(api, item.boundary, at);
    const icon = findIcon(item.ref);
    if (icon) void insertCard(api, icon, at);
  }, [api, findIcon]);

  const insertAtCenter = useCallback((item: PaletteItem) => {
    if (api) insertAt(item, sceneCenter(api.getAppState()));
  }, [api, insertAt]);

  const insertAtClient = useCallback((item: PaletteItem, clientX: number, clientY: number) => {
    if (api) insertAt(item, clientToScene(clientX, clientY, api.getAppState()));
  }, [api, insertAt]);

  return { insertAtCenter, insertAtClient };
};
