import { CaptureUpdateAction, convertToExcalidrawElements, newElementWith } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, ExcalidrawImageElement, ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { withArchData, readCardData } from "./archData";
import { iconFile, resizeText, toFileId } from "./excalidrawAdapter";

const CAPTION_COLOR = "#868e96";
const CAPTION_RATIO = 0.78;

type CardParts = { card: ExcalidrawElement; label?: ExcalidrawTextElement; caption?: ExcalidrawTextElement; icon?: ExcalidrawImageElement };

const isText = (el: ExcalidrawElement): el is ExcalidrawTextElement => el.type === "text";
const isImage = (el: ExcalidrawElement): el is ExcalidrawImageElement => el.type === "image";

/** Partes do card pelos ids da fábrica (`-label`, `-caption`, `-icon`); cai no grupo para cards antigos. */
const partsOf = (elements: readonly ExcalidrawElement[], cardId: string): CardParts | null => {
  const card = elements.find((el) => el.id === cardId && !el.isDeleted);
  if (!card) return null;
  const group = card.groupIds[0];
  const members = elements.filter((el) => !el.isDeleted && el.id !== cardId && group !== undefined && el.groupIds.includes(group));
  const texts = members.filter(isText);
  return {
    card,
    label: texts.find((el) => el.id === `${cardId}-label`) ?? texts[0],
    caption: texts.find((el) => el.id === `${cardId}-caption`),
    icon: members.filter(isImage)[0],
  };
};

const replaceElements = (api: ExcalidrawImperativeAPI, changed: readonly ExcalidrawElement[], added: readonly ExcalidrawElement[] = []): void => {
  const byId = new Map(changed.map((el) => [el.id, el]));
  const elements = api.getSceneElementsIncludingDeleted().map((el) => byId.get(el.id) ?? el);
  api.updateScene({ elements: [...elements, ...added], captureUpdate: CaptureUpdateAction.IMMEDIATELY });
};

const withText = (el: ExcalidrawTextElement, text: string): ExcalidrawTextElement =>
  resizeText(newElementWith(el, { text, originalText: text }));

/**
 * Renomeia o card: troca o texto do rótulo e re-mede mantendo-o centralizado.
 * @example renameCard(api, "orders", "orders-service v2")
 */
export const renameCard = (api: ExcalidrawImperativeAPI, cardId: string, name: string): void => {
  const parts = partsOf(api.getSceneElements(), cardId);
  if (parts?.label && name.trim() !== "" && parts.label.text !== name) replaceElements(api, [withText(parts.label, name)]);
};

const newCaption = (parts: CardParts, text: string): ExcalidrawElement => {
  const fontSize = Math.round((parts.label?.fontSize ?? 16) * CAPTION_RATIO);
  const top = parts.label ? parts.label.y + parts.label.height + 4 : parts.card.y + parts.card.height + 8;
  const [caption] = convertToExcalidrawElements([{
    type: "text", id: `${parts.card.id}-caption`, text, fontSize, textAlign: "center", strokeColor: CAPTION_COLOR,
    x: parts.card.x, y: top, groupIds: [...parts.card.groupIds],
  }], { regenerateIds: false });
  return newElementWith(caption, { x: parts.card.x + parts.card.width / 2 - caption.width / 2 });
};

/** Legenda vazia remove; sem legenda ainda, cria embaixo do nome. */
export const setCardCaption = (api: ExcalidrawImperativeAPI, cardId: string, text: string): void => {
  const parts = partsOf(api.getSceneElements(), cardId);
  if (!parts) return;
  const value = text.trim();
  if (parts.caption && value === "") return replaceElements(api, [newElementWith(parts.caption, { isDeleted: true })]);
  if (parts.caption && parts.caption.text !== text) return replaceElements(api, [withText(parts.caption, text)]);
  if (!parts.caption && value !== "") replaceElements(api, [], [newCaption(parts, text)]);
};

/** Troca a imagem do card e guarda a nova referência de ícone no customData. */
export const setCardIcon = (api: ExcalidrawImperativeAPI, cardId: string, iconRef: string, dataUrl: string): void => {
  const parts = partsOf(api.getSceneElements(), cardId);
  const data = parts ? readCardData(parts.card) : null;
  if (!parts?.icon || !data) return;
  api.addFiles([iconFile(iconRef, dataUrl)]);
  replaceElements(api, [
    newElementWith(parts.icon, { fileId: toFileId(iconRef) }),
    newElementWith(parts.card, { customData: withArchData(parts.card.customData, { ...data, iconRef }) }),
  ]);
};

export const captionOf = (elements: readonly ExcalidrawElement[], cardId: string): string =>
  partsOf(elements, cardId)?.caption?.text ?? "";
