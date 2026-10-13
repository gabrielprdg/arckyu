import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { SceneGraph } from "../arch/sceneGraph";
import type { InspectorTarget } from "../ui/Inspector";
import { captionOf } from "../arch/cardEditing";
import type { IconCategory } from "../model/types";
import { readCardData } from "../arch/archData";

const labelOf = (card: ExcalidrawElement, elements: readonly ExcalidrawElement[]): string => {
  const group = card.groupIds[0];
  const inGroup = elements.filter((el) => el.type === "text" && !el.isDeleted && group !== undefined && el.groupIds.includes(group));
  const label = inGroup.find((el) => el.id === `${card.id}-label`) ?? inGroup[0];
  return label?.type === "text" ? label.text : "";
};

/** Decide o que o inspetor mostra a partir da seleção do Excalidraw. */
export const resolveInspectorTarget = (
  graph: SceneGraph, elements: readonly ExcalidrawElement[], selectedIds: readonly string[], categoryOf: (iconRef: string) => IconCategory,
): InspectorTarget => {
  const cardIds = new Set(selectedIds.flatMap((id) => graph.memberToCard.get(id) ?? []));
  const onlyCardMembers = selectedIds.every((id) => graph.memberToCard.has(id));
  if (cardIds.size === 1 && onlyCardMembers) {
    const card = elements.find((el) => el.id === [...cardIds][0]);
    if (!card) return null;
    const category = categoryOf(readCardData(card)?.iconRef ?? "");
    return { kind: "card", element: card, name: labelOf(card, elements), caption: captionOf(elements, card.id), category };
  }
  const single = selectedIds.length === 1 ? elements.find((el) => el.id === selectedIds[0]) : undefined;
  if (single?.type !== "arrow") return null;
  // O grafo já aplicou a regra "ligada a dois cards anima por padrão"; o painel mostra esse estado real.
  const effective = graph.flows.find((flow) => flow.id === single.id);
  return { kind: "arrow", element: single, connected: effective?.edge != null, flow: effective?.flow ?? null };
};
