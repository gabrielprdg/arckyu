import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useRef } from "react";
import { refreshTextDimensions } from "../arch/excalidrawAdapter";

const sceneText = (api: ExcalidrawImperativeAPI): string =>
  api.getSceneElements().flatMap((el) => (el.type === "text" ? [el.text] : [])).join(" ");

// Cena montada antes do Excalidraw registrar a Excalifont é medida com a fonte reserva (mais estreita) e o texto
// sai cortado. Depois que a fonte real carrega para os caracteres da cena, re-mede uma vez.
export const remeasureWhenFontsReady = async (api: ExcalidrawImperativeAPI): Promise<void> => {
  try {
    await document.fonts.load("20px Excalifont", sceneText(api));
    await document.fonts.ready;
  } catch {
    return;
  }
  refreshTextDimensions(api);
};

/** Uma vez por carga, quando a cena já tem elementos. */
export const useTextRemeasure = (api: ExcalidrawImperativeAPI | null, hasElements: boolean): void => {
  const doneRef = useRef(false);
  useEffect(() => {
    if (!api || !hasElements || doneRef.current) return;
    doneRef.current = true;
    void remeasureWhenFontsReady(api);
  }, [api, hasElements]);
};
