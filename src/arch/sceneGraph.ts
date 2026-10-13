import type { ArchCardData, Communication, GraphEdge, RenderFlow } from "../model/types";
import { arrowCommunication, DEFAULT_FLOW, readCardData, readFlowData } from "./archData";
import { arrowPathD, type Point } from "./arrowPath";

/** Subconjunto estrutural de ExcalidrawElement usado aqui (facilita teste sem montar elementos completos). */
export type SceneElementLike = {
  id: string;
  type: string;
  isDeleted: boolean;
  groupIds: readonly string[];
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: string;
  roundness: unknown;
  customData?: Record<string, unknown>;
  points?: readonly Point[];
  elbowed?: boolean;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
};

export type Bounds = { x: number; y: number; width: number; height: number };
/** `bounds` = moldura do card; `groupBounds` = moldura + nome + legenda (área que o play deixa acesa). */
export type CardInfo = { id: string; data: ArchCardData; bounds: Bounds; groupBounds: Bounds };
export type FlowArrow = { id: string; path: string; edge: GraphEdge | null; flow: RenderFlow; communication: Communication };

export type SceneGraph = {
  cards: Map<string, CardInfo>;
  /** Qualquer elemento do grupo do card (ícone, rótulo) → id do card; setas podem grudar em qualquer um. */
  memberToCard: Map<string, string>;
  flows: FlowArrow[];
  edges: GraphEdge[];
};

const collectCards = (elements: readonly SceneElementLike[]): Map<string, CardInfo> =>
  new Map(elements.flatMap((el) => {
    const data = el.isDeleted ? null : readCardData(el);
    const bounds = { x: el.x, y: el.y, width: el.width, height: el.height };
    return data ? [[el.id, { id: el.id, data, bounds, groupBounds: bounds }] as const] : [];
  }));

const mapMembers = (elements: readonly SceneElementLike[], cards: Map<string, CardInfo>): Map<string, string> => {
  const byGroup = new Map(elements.flatMap((el) => (cards.has(el.id) && el.groupIds[0] ? [[el.groupIds[0], el.id] as const] : [])));
  const members = new Map([...cards.keys()].map((id) => [id, id] as const));
  for (const el of elements) {
    const cardId = el.groupIds.map((group) => byGroup.get(group)).find((id) => id !== undefined);
    if (cardId && !el.isDeleted) members.set(el.id, cardId);
  }
  return members;
};

const union = (a: Bounds, b: Bounds): Bounds => {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
};

const growGroupBounds = (elements: readonly SceneElementLike[], cards: Map<string, CardInfo>, memberToCard: Map<string, string>): void => {
  for (const el of elements) {
    const card = el.isDeleted ? undefined : cards.get(memberToCard.get(el.id) ?? "");
    if (card) card.groupBounds = union(card.groupBounds, { x: el.x, y: el.y, width: el.width, height: el.height });
  }
};

const toFlowArrow = (arrow: SceneElementLike, memberToCard: Map<string, string>): FlowArrow | null => {
  const source = arrow.startBinding ? memberToCard.get(arrow.startBinding.elementId) : undefined;
  const target = arrow.endBinding ? memberToCard.get(arrow.endBinding.elementId) : undefined;
  const bothEnds = source !== undefined && target !== undefined;
  // Seta ligando dois cards já nasce animada; o customData sobrescreve.
  const settings = readFlowData(arrow)?.flow ?? (bothEnds ? DEFAULT_FLOW : null);
  if (!settings || !arrow.points) return null;
  return {
    id: arrow.id,
    path: arrowPathD({ x: arrow.x, y: arrow.y, points: arrow.points, roundness: arrow.roundness, elbowed: arrow.elbowed }),
    edge: bothEnds ? { id: arrow.id, source, target } : null,
    flow: { ...settings, color: arrow.strokeColor, width: arrow.strokeWidth },
    communication: arrowCommunication(arrow),
  };
};

/**
 * Lê a cena do Excalidraw e devolve cards, setas animáveis e o grafo para o modo play.
 * @example buildSceneGraph(api.getSceneElements()).edges
 */
export const buildSceneGraph = (elements: readonly SceneElementLike[]): SceneGraph => {
  const cards = collectCards(elements);
  const memberToCard = mapMembers(elements, cards);
  growGroupBounds(elements, cards, memberToCard);
  growGroupBounds(elements, cards, memberToCard);
  const flows = elements
    .filter((el) => el.type === "arrow" && !el.isDeleted)
    .flatMap((arrow) => toFlowArrow(arrow, memberToCard) ?? []);
  return { cards, memberToCard, flows, edges: flows.flatMap((flow) => (flow.edge ? [flow.edge] : [])) };
};
