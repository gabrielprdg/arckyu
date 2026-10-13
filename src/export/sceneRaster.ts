import { exportToCanvas, exportToSvg, getCommonBounds } from "@excalidraw/excalidraw";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles } from "@excalidraw/excalidraw/types";
import type { Bounds } from "../arch/sceneGraph";

/** O que o export lê da cena do Excalidraw. */
export type SceneSource = { elements: readonly NonDeletedExcalidrawElement[]; files: BinaryFiles; viewBackgroundColor: string };

const EXPORT_PADDING = 32;

// Mesmo recorte do exportador do Excalidraw: filhos de frame ficam de fora da conta.
const rootElements = (elements: readonly NonDeletedExcalidrawElement[]) => {
  const frames = new Set(elements.filter((el) => el.type === "frame" || el.type === "magicframe").map((el) => el.id));
  return elements.filter((el) => frames.has(el.id) || !el.frameId || !frames.has(el.frameId));
};

/**
 * Área exportada em coordenadas de cena (conteúdo + margem); pixel 0,0 da imagem = canto desta área.
 * @example exportArea(api.getSceneElements()) // { x: -32, y: -32, width: 1664, height: 900 }
 */
export const exportArea = (elements: readonly NonDeletedExcalidrawElement[]): Bounds => {
  const [minX, minY, maxX, maxY] = getCommonBounds(rootElements(elements));
  return { x: minX - EXPORT_PADDING, y: minY - EXPORT_PADDING, width: maxX - minX + EXPORT_PADDING * 2, height: maxY - minY + EXPORT_PADDING * 2 };
};

const exportAppState = (source: SceneSource, dark: boolean) => ({
  exportBackground: true,
  viewBackgroundColor: source.viewBackgroundColor,
  exportWithDarkMode: dark,
});

/** Diagrama estático em canvas, `scale` pixels por unidade de cena (o tema escuro já vem filtrado). */
export const rasterizeScene = (source: SceneSource, dark: boolean, scale: number): Promise<HTMLCanvasElement> =>
  exportToCanvas({
    elements: source.elements,
    files: source.files,
    exportPadding: EXPORT_PADDING,
    appState: exportAppState(source, dark),
    getDimensions: (width: number, height: number) => ({ width: Math.ceil(width * scale), height: Math.ceil(height * scale), scale }),
  });

/** Diagrama estático em SVG (fontes embutidas), com viewBox = `exportArea` deslocada para 0,0. */
export const sceneToSvg = (source: SceneSource, dark: boolean): Promise<SVGSVGElement> =>
  exportToSvg({ elements: source.elements, files: source.files, exportPadding: EXPORT_PADDING, appState: exportAppState(source, dark) });
