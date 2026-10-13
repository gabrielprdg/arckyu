import { findIcon, type IconDefinition } from "../icons/catalog";
import { categoryStyle } from "../icons/categoryStyle";
import type { ArchFlowData, GraphEdge } from "../model/types";
import { DEFAULT_FLOW } from "./archData";
import { CARD_SIZE, cardSkeletons, type CardSpec } from "./cardFactory";

export type Side = "l" | "r" | "t" | "b";
type Point = [number, number];

export type TemplateCard = Omit<CardSpec, "frameColor">;

export type ArrowKind = "sync" | "async" | "callback";

export type TemplateArrow = {
  id: string;
  from: string;
  fromSide: Side;
  to: string;
  toSide: Side;
  label: string;
  kind?: ArrowKind;
  packets?: boolean;
  /** Desloca o ponto de saída/chegada ao longo do lado (px), para setas paralelas não se sobreporem. */
  fromOffset?: number;
  toOffset?: number;
  /** Pontos intermediários absolutos (contornar o diagrama). */
  via?: Point[];
  /** Rota ortogonal por cima/baixo: sobe (ou desce) até este y, atravessa e chega na vertical. Acompanha a escala. */
  detourY?: number;
};

/** Fronteira do C4 (sistema, VPC, ambiente). Desenhada como retângulo tracejado: frame do Excalidraw corta setas que saem dele. */
export type TemplateBoundary = { id: string; name: string; x: number; y: number; width: number; height: number };
export type TemplateText = { id: string; text: string; x: number; y: number; fontSize: number; color?: string };
export type TemplateScenario = { name: string; path: string[] };

export type TemplateFonts = { cardLabel: number; caption: number; arrowLabel: number; boundary: number };

export const DEFAULT_TEMPLATE_FONTS: TemplateFonts = { cardLabel: 16, caption: 12, arrowLabel: 13, boundary: 16 };

/** Como as setas animam: só bolinhas (traço contínuo) ou tracejado em movimento (assíncrono tracejado). */
export type ArrowMotion = "packets" | "ants";

export type ArrowStyle = { width: number; motion: ArrowMotion; speed: number };

const DEFAULT_ARROW_STYLE: ArrowStyle = { width: 2, motion: "ants", speed: 40 };

export type DiagramTemplate = {
  id: string;
  title: string;
  fonts?: TemplateFonts;
  /** Lado dos cards em px (padrão 84). */
  cardSize?: number;
  arrowStyle?: ArrowStyle;
  cards: TemplateCard[];
  arrows: TemplateArrow[];
  boundaries: TemplateBoundary[];
  texts: TemplateText[];
  scenarios: TemplateScenario[];
};

const ARROW_COLOR: Record<ArrowKind, string> = { sync: "#e03131", async: "#f08c00", callback: "#7048e8" };

const styleOf = (template: DiagramTemplate): ArrowStyle => template.arrowStyle ?? DEFAULT_ARROW_STYLE;
const cardSizeOf = (template: DiagramTemplate): number => template.cardSize ?? CARD_SIZE;

const fontsOf = (template: DiagramTemplate): TemplateFonts => template.fonts ?? DEFAULT_TEMPLATE_FONTS;

const anchor = (card: TemplateCard, side: Side, size: number, offset = 0): Point => {
  const mid = size / 2;
  const offsets: Record<Side, Point> = { l: [0, mid + offset], r: [size, mid + offset], t: [mid + offset, 0], b: [mid + offset, size] };
  return [card.x + offsets[side][0], card.y + offsets[side][1]];
};

const cardOf = (template: DiagramTemplate, id: string): TemplateCard => {
  const card = template.cards.find((candidate) => candidate.id === id);
  if (!card) throw new Error(`modelo "${template.id}": card "${id}" não existe; ids válidos: ${template.cards.map((c) => c.id).join(", ")}`);
  return card;
};

/** Pontos relativos ao início, com largura/altura nunca 0 (0 vira tamanho padrão no convertToExcalidrawElements). */
export const relativePoints = (absolute: readonly Point[]): Point[] => {
  const [x0, y0] = absolute[0];
  return absolute.map(([x, y]): Point => [x - x0, y - y0]);
};

const waypoints = (spec: TemplateArrow, start: Point, end: Point): Point[] =>
  spec.detourY !== undefined ? [[start[0], spec.detourY], [end[0], spec.detourY]] : spec.via ?? [];

// "packets": todas animam com bolinhas sobre traço contínuo. "ants": assíncrono tracejado; bolinhas só onde o modelo pedir.
const flowDataOf = (template: DiagramTemplate, spec: TemplateArrow): ArchFlowData => {
  const { motion, speed } = styleOf(template);
  const flow = motion === "packets"
    ? { ...DEFAULT_FLOW, speed, animated: false, packets: true }
    : { ...DEFAULT_FLOW, speed, animated: true, packets: spec.packets ?? false };
  return { kind: "flow", flow, communication: spec.kind === "async" ? "async" : "sync" };
};

const arrowSkeleton = (template: DiagramTemplate, spec: TemplateArrow) => {
  const size = cardSizeOf(template);
  const start = anchor(cardOf(template, spec.from), spec.fromSide, size, spec.fromOffset);
  const end = anchor(cardOf(template, spec.to), spec.toSide, size, spec.toOffset);
  const points = relativePoints([start, ...waypoints(spec, start, end), end]);
  const kind = spec.kind ?? "sync";
  const { width, motion } = styleOf(template);
  const strokeStyle = motion === "ants" && kind === "async" ? ("dashed" as const) : ("solid" as const);
  const data = flowDataOf(template, spec);
  return {
    type: "arrow" as const, id: spec.id, x: start[0], y: start[1], points,
    start: { id: spec.from }, end: { id: spec.to }, label: { text: spec.label, fontSize: fontsOf(template).arrowLabel },
    strokeColor: ARROW_COLOR[kind], strokeStyle, strokeWidth: width, roughness: 1,
    roundness: null, endArrowhead: "arrow" as const, customData: { archflow: data },
  };
};

const frameColorOf = (catalog: readonly IconDefinition[], iconRef: string): string =>
  categoryStyle(findIcon(catalog, iconRef)?.category ?? "compute").tile;

const BOUNDARY_COLOR = "#868e96";

// Travados: ficam atrás como fundo e não roubam o clique nem a ponta das setas.
const boundarySkeletons = (boundary: TemplateBoundary, fontSize: number) => [
  {
    type: "rectangle" as const, id: boundary.id, x: boundary.x, y: boundary.y, width: boundary.width, height: boundary.height,
    strokeColor: BOUNDARY_COLOR, backgroundColor: "transparent", strokeStyle: "dashed" as const, strokeWidth: 1, roughness: 1,
    roundness: { type: 3 as const }, locked: true,
  },
  {
    type: "text" as const, id: `${boundary.id}-name`, text: boundary.name, x: boundary.x + 12, y: boundary.y - fontSize * 1.6,
    fontSize, strokeColor: BOUNDARY_COLOR, locked: true,
  },
];

const textSkeleton = (text: TemplateText) => ({
  type: "text" as const, id: text.id, text: text.text, x: text.x, y: text.y, fontSize: text.fontSize, strokeColor: text.color ?? "#1e1e1e",
});

/**
 * Esqueletos do Excalidraw para o modelo inteiro (fronteiras, cards, setas com animação e textos).
 * @example buildTemplateSkeletons(lojaNimbusC4Template, toFileId, ICON_CATALOG)
 */
export const buildTemplateSkeletons = <F extends string>(template: DiagramTemplate, fileIdFor: (iconRef: string) => F, catalog: readonly IconDefinition[]) => {
  const fonts = fontsOf(template);
  const cardFonts = { label: fonts.cardLabel, caption: fonts.caption };
  const size = cardSizeOf(template);
  const cards = template.cards.map((card) => cardSkeletons({ ...card, size, fonts: cardFonts, frameColor: frameColorOf(catalog, card.iconRef) }, fileIdFor));
  return {
    cards: cards.flat(),
    arrows: template.arrows.map((arrow) => arrowSkeleton(template, arrow)),
    boundaries: template.boundaries.flatMap((boundary) => boundarySkeletons(boundary, fonts.boundary)),
    texts: template.texts.map(textSkeleton),
  };
};

export const templateEdges = (template: DiagramTemplate): GraphEdge[] =>
  template.arrows.map((arrow) => ({ id: arrow.id, source: arrow.from, target: arrow.to }));

export const templateIconRefs = (template: DiagramTemplate): string[] => [...new Set(template.cards.map((card) => card.iconRef))];

const scalePoint = ([x, y]: Point, factor: number): Point => [Math.round(x * factor), Math.round(y * factor)];

/**
 * Espaça o layout (posições, rotas e fronteiras) sem mudar o tamanho dos cards; usado quando a fonte cresce.
 * @example scaleLayout(template, 1.35).cards[0].x // x original × 1.35
 */
export const scaleLayout = (template: DiagramTemplate, factor: number): DiagramTemplate => ({
  ...template,
  cards: template.cards.map((card) => ({ ...card, x: Math.round(card.x * factor), y: Math.round(card.y * factor) })),
  arrows: template.arrows.map((arrow) => ({
    ...arrow,
    via: arrow.via?.map((point) => scalePoint(point, factor)),
    detourY: arrow.detourY === undefined ? undefined : Math.round(arrow.detourY * factor),
  })),
  boundaries: template.boundaries.map((b) => ({ ...b, x: Math.round(b.x * factor), y: Math.round(b.y * factor), width: Math.round(b.width * factor), height: Math.round(b.height * factor) })),
  texts: template.texts.map((text) => ({ ...text, x: Math.round(text.x * factor), y: Math.round(text.y * factor) })),
});
