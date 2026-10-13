import { hashElementsVersion } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState } from "@excalidraw/excalidraw/types";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Viewport } from "../overlay/FlowOverlay";

export type SceneSnapshot = {
  elements: readonly OrderedExcalidrawElement[];
  /** Hash de id+versão: o Excalidraw muta elementos no lugar, então identidade do array não serve para detectar mudança. */
  sceneVersion: number;
  viewport: Viewport;
  dark: boolean;
  selectedIds: string[];
};

const EMPTY: SceneSnapshot = { elements: [], sceneVersion: 0, viewport: { scrollX: 0, scrollY: 0, zoom: 1 }, dark: false, selectedIds: [] };

const SAFETY_FLUSH_MS = 100;

const sameViewport = (a: Viewport, b: Viewport): boolean => a.scrollX === b.scrollX && a.scrollY === b.scrollY && a.zoom === b.zoom;

const sameSelection = (a: string[], b: string[]): boolean => a.length === b.length && a.every((id, i) => id === b[i]);

const isUnchanged = (prev: SceneSnapshot, next: SceneSnapshot): boolean =>
  prev.sceneVersion === next.sceneVersion && prev.dark === next.dark && sameViewport(prev.viewport, next.viewport) && sameSelection(prev.selectedIds, next.selectedIds);

/**
 * Espelha o que a camada animada precisa do Excalidraw; o onChange dispara muito, então agrupa por frame.
 * @example const { snapshot, onChange } = useSceneSnapshot(); <Excalidraw onChange={onChange} />
 */
export const useSceneSnapshot = () => {
  const [snapshot, setSnapshot] = useState<SceneSnapshot>(EMPTY);
  const pendingRef = useRef<SceneSnapshot | null>(null);
  const scheduledRef = useRef(false);
  const rafRef = useRef(0);
  const timerRef = useRef(0);

  const cancelScheduled = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    window.clearTimeout(timerRef.current);
    scheduledRef.current = false;
  }, []);

  // Agrupa por frame (rAF), com um timer de segurança: rAF não dispara com a aba ou o painel oculto, e sem o timer
  // a seleção/cena ficaria "presa" até o próximo frame (o inspetor não abria no primeiro clique).
  const scheduleFlush = useCallback(() => {
    if (scheduledRef.current) return;
    scheduledRef.current = true;
    const flush = () => {
      if (!scheduledRef.current) return;
      cancelScheduled();
      const next = pendingRef.current;
      if (next) setSnapshot((prev) => (isUnchanged(prev, next) ? prev : next));
    };
    rafRef.current = requestAnimationFrame(flush);
    timerRef.current = window.setTimeout(flush, SAFETY_FLUSH_MS);
  }, [cancelScheduled]);

  const onChange = useCallback((elements: readonly OrderedExcalidrawElement[], appState: AppState) => {
    pendingRef.current = {
      elements,
      sceneVersion: hashElementsVersion(elements),
      viewport: { scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom.value },
      dark: appState.theme === "dark",
      selectedIds: Object.keys(appState.selectedElementIds).filter((id) => appState.selectedElementIds[id]),
    };
    scheduleFlush();
  }, [scheduleFlush]);

  // No StrictMode o efeito desmonta e remonta logo na carga, e o Excalidraw pode já ter emitido os únicos
  // onChange da inicialização nesse meio-tempo; ao remontar, reaplica o pendente em vez de perdê-lo.
  useEffect(() => {
    if (pendingRef.current) scheduleFlush();
    return cancelScheduled;
  }, [scheduleFlush, cancelScheduled]);
  return { snapshot, onChange };
};
