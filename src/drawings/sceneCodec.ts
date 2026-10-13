import { serializeAsJSON } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { EMPTY_BOOK } from "../app/scenarioBook";
import { createTemplateScene, templateScenarioBook } from "../app/templateData";
import type { DiagramTemplate } from "../arch/diagramTemplate";
import type { NewDrawing } from "./drawingLibrary";

/** Cena crua como o onChange do Excalidraw entrega. */
export type RawScene = { elements: readonly OrderedExcalidrawElement[]; appState: Partial<AppState>; files: BinaryFiles };

/** Cena no formato do arquivo .excalidraw (o mesmo do "Salvar em…"). */
export const encodeScene = (scene: RawScene): string => serializeAsJSON(scene.elements, scene.appState, scene.files, "local");

const isSceneJson = (value: unknown): value is ExcalidrawInitialDataState =>
  typeof value === "object" && value !== null && "elements" in value && Array.isArray(value.elements);

/**
 * Lê a cena salva para o `initialData` do Excalidraw; erro explica o que veio.
 * @example decodeScene(content.scene).elements?.length
 */
export const decodeScene = (text: string): ExcalidrawInitialDataState => {
  const parsed: unknown = JSON.parse(text);
  if (!isSceneJson(parsed)) throw new Error(`cena salva sem lista "elements" (início: ${text.slice(0, 60)}…)`);
  return parsed;
};

export const blankDrawing = (name: string): NewDrawing => ({ name, scene: encodeScene({ elements: [], appState: {}, files: {} }), book: EMPTY_BOOK });

/** Desenho novo a partir de um modelo (assíncrono: os logos vêm do Iconify). */
export const templateDrawing = async (template: DiagramTemplate): Promise<NewDrawing> => {
  const scene = await createTemplateScene(template);
  const text = serializeAsJSON(scene.elements ?? [], scene.appState ?? {}, scene.files ?? {}, "local");
  return { name: template.title, scene: text, book: templateScenarioBook(template) };
};
