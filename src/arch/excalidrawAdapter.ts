import {
  CaptureUpdateAction, convertToExcalidrawElements, newElementWith, viewportCoordsToSceneCoords,
} from "@excalidraw/excalidraw";
import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { ExcalidrawElement, ExcalidrawLinearElement, ExcalidrawTextElement, FileId } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFileData, DataURL, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { iconFileId } from "./cardFactory";

// Camada fina sobre a API do Excalidraw: o resto do app não importa o pacote direto.

/** FileId/DataURL são tipos "branded" do Excalidraw; a única forma de criá-los é afirmando o tipo aqui. */
export const toFileId = (iconRef: string): FileId => iconFileId(iconRef) as FileId;
const toFileIdRaw = (fileId: string): FileId => fileId as FileId;
const toDataUrl = (url: string): DataURL => url as DataURL;

const mimeOf = (dataUrl: string): BinaryFileData["mimeType"] => {
  const mime = dataUrl.slice(5, dataUrl.indexOf(";"));
  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/webp" || mime === "image/gif") return mime;
  return "image/svg+xml";
};

/** Arquivo de imagem com id já pronto (usado na migração de ícones antigos). */
export const iconFileDataFromUrl = (fileId: string, dataUrl: string): BinaryFileData => ({
  id: toFileIdRaw(fileId),
  dataURL: toDataUrl(dataUrl),
  mimeType: mimeOf(dataUrl),
  created: Date.now(),
});

export const iconFile = (iconRef: string, dataUrl: string): BinaryFileData => ({
  id: toFileId(iconRef),
  dataURL: toDataUrl(dataUrl),
  mimeType: mimeOf(dataUrl),
  created: Date.now(),
});

const CARD_TEXT_SUFFIX = /-(label|caption)$/;

// A largura do texto só existe depois que o Excalidraw mede a fonte; então nome e legenda são centralizados sob o card aqui.
const centerCardLabels = (elements: ExcalidrawElement[]): ExcalidrawElement[] => {
  const byId = new Map(elements.map((el) => [el.id, el]));
  return elements.map((el) => {
    const card = el.type === "text" && CARD_TEXT_SUFFIX.test(el.id) ? byId.get(el.id.replace(CARD_TEXT_SUFFIX, "")) : undefined;
    return card ? newElementWith(el, { x: card.x + card.width / 2 - el.width / 2 }) : el;
  });
};

export const toElements = (skeletons: ExcalidrawElementSkeleton[]): ExcalidrawElement[] =>
  centerCardLabels(convertToExcalidrawElements(skeletons, { regenerateIds: false }));

/** Insere elementos novos já selecionados, como um único passo de undo. */
export const insertElements = (api: ExcalidrawImperativeAPI, elements: ExcalidrawElement[], files: BinaryFileData[]): void => {
  api.addFiles(files);
  api.updateScene({
    elements: [...api.getSceneElementsIncludingDeleted(), ...elements],
    appState: { selectedElementIds: Object.fromEntries(elements.map((el) => [el.id, true])) },
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  });
};

type ElementPatch = { customData?: Record<string, unknown>; strokeStyle?: ExcalidrawElement["strokeStyle"] };

/** Atualiza um elemento pelo id via newElementWith (bump de versão → entra no undo e na colaboração). */
export const patchElement = (api: ExcalidrawImperativeAPI, id: string, patch: ElementPatch): void => {
  const elements = api.getSceneElementsIncludingDeleted().map((el) => (el.id === id ? newElementWith(el, patch) : el));
  api.updateScene({ elements, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
};

export const sceneCenter = (appState: AppState): { x: number; y: number } => ({
  x: appState.width / 2 / appState.zoom.value - appState.scrollX,
  y: appState.height / 2 / appState.zoom.value - appState.scrollY,
});

export const clientToScene = (clientX: number, clientY: number, appState: AppState): { x: number; y: number } =>
  viewportCoordsToSceneCoords({ clientX, clientY }, appState);

/** Troca o fileId de imagens sem entrar no undo (migração técnica, não ação do usuário). */
export const remapImageFiles = (api: ExcalidrawImperativeAPI, remap: ReadonlyMap<string, string>): void => {
  const elements = api.getSceneElementsIncludingDeleted().map((el) => {
    if (el.type !== "image" || !el.fileId) return el;
    const next = remap.get(el.fileId);
    return next ? newElementWith(el, { fileId: toFileIdRaw(next) }) : el;
  });
  api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER });
};

/** LocalPoint é "branded" no Excalidraw; pontos de modelos (números simples) entram por aqui. */
export const toLinearPoints = (points: readonly (readonly [number, number])[]): ExcalidrawLinearElement["points"] =>
  points as ExcalidrawLinearElement["points"];

// Mede recriando o texto pelo conversor do Excalidraw (o refreshDimensions do restoreElements não re-mede texto solto).
const measuredSize = (el: ExcalidrawTextElement): { width: number; height: number } => {
  const [probe] = convertToExcalidrawElements([{ type: "text", text: el.originalText, fontSize: el.fontSize, fontFamily: el.fontFamily, lineHeight: el.lineHeight, x: 0, y: 0 }]);
  return { width: probe.width, height: probe.height };
};

// Texto centralizado (nome de card, rótulo de seta) cresce a partir do centro; alinhado à esquerda mantém o x.
export const resizeText = (el: ExcalidrawTextElement): ExcalidrawTextElement => {
  const size = measuredSize(el);
  if (Math.abs(size.width - el.width) < 0.5 && Math.abs(size.height - el.height) < 0.5) return el;
  const centered = el.containerId !== null || el.textAlign === "center";
  const x = centered ? el.x + (el.width - size.width) / 2 : el.x;
  const y = el.containerId !== null ? el.y + (el.height - size.height) / 2 : el.y;
  return newElementWith(el, { ...size, x, y });
};

// Só texto solto (autoResize) e rótulo de seta; texto dentro de forma quebra linha pela largura da forma e fica como está.
const isResizable = (el: ExcalidrawElement, byId: Map<string, ExcalidrawElement>): el is ExcalidrawTextElement => {
  if (el.type !== "text" || el.isDeleted || !el.autoResize) return false;
  return el.containerId === null || byId.get(el.containerId)?.type === "arrow";
};

/** Re-mede os textos com a fonte já carregada (cena montada antes da Excalifont sai cortada); fora do undo. */
export const refreshTextDimensions = (api: ExcalidrawImperativeAPI): void => {
  const all = api.getSceneElementsIncludingDeleted();
  const byId = new Map(all.map((el) => [el.id, el]));
  const elements = all.map((el) => (isResizable(el, byId) ? resizeText(el) : el));
  api.updateScene({ elements, captureUpdate: CaptureUpdateAction.NEVER });
};
