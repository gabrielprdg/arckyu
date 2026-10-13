import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useMemo } from "react";
import { renameCard, setCardCaption, setCardIcon } from "../arch/cardEditing";
import { patchElement } from "../arch/excalidrawAdapter";
import type { IconDefinition } from "../icons/catalog";
import { resolveIconDataUrl } from "../icons/iconImage";
import type { IconSource } from "../icons/iconSource";
import { toCanvasImage } from "../icons/rasterize";
import type { IconCategory } from "../model/types";
import type { CardEditActions } from "../ui/CardInspector";

const browserFetch = (url: string, init?: { signal?: AbortSignal }) => fetch(url, init);

// Ícone escolhido no painel não precisa estar no catálogo: a ref só identifica o arquivo da imagem.
const refFor = (source: IconSource, category: IconCategory): string => {
  if (source.kind === "iconify") return `iconify:${source.id}`;
  if (source.kind === "upload") return `upload:${crypto.randomUUID().slice(0, 8)}`;
  return `generic-${category}`;
};

/** Ações de edição de card usadas pelo inspetor (nome, legenda, ícone e customData). */
export const useCardEditing = (api: ExcalidrawImperativeAPI | null): CardEditActions => {
  const onPatch = useCallback((id: string, customData: Record<string, unknown>) => {
    if (api) patchElement(api, id, { customData });
  }, [api]);

  const onRename = useCallback((cardId: string, name: string) => { if (api) renameCard(api, cardId, name); }, [api]);
  const onCaption = useCallback((cardId: string, caption: string) => { if (api) setCardCaption(api, cardId, caption); }, [api]);

  const onChangeIcon = useCallback(async (cardId: string, name: string, category: IconCategory, source: IconSource) => {
    if (!api) return;
    const icon: IconDefinition = { ref: refFor(source, category), name, category, aliases: [], source };
    const dataUrl = await toCanvasImage(await resolveIconDataUrl(icon, { fetchFn: browserFetch }));
    setCardIcon(api, cardId, icon.ref, dataUrl);
  }, [api]);

  return useMemo(() => ({ onPatch, onRename, onCaption, onChangeIcon }), [onPatch, onRename, onCaption, onChangeIcon]);
};
