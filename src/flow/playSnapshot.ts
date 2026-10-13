import type { Bounds, SceneGraph } from "../arch/sceneGraph";
import type { ScenarioStep } from "../model/types";
import { stepEndpoints } from "./scenario";

/** O que o play mostra num passo: cards acesos agora, já visitados e áreas fora do esmaecimento. */
export type PlaySnapshot = {
  step: ScenarioStep | null;
  activeCards: Bounds[];
  visitedCards: Bounds[];
  litAreas: Bounds[];
};

export const EMPTY_PLAY_SNAPSHOT: PlaySnapshot = { step: null, activeCards: [], visitedCards: [], litAreas: [] };

const cardsOf = (graph: SceneGraph, steps: readonly ScenarioStep[]) =>
  [...new Set(steps.flatMap((step) => {
    const ends = stepEndpoints(step, graph.edges);
    return ends ? [ends.from, ends.to] : [];
  }))].flatMap((id) => graph.cards.get(id) ?? []);

/**
 * Estado visual do play no passo `stepIndex` (limitado ao último).
 * @example playSnapshotAt(graph, steps, 0).activeCards.length // 2
 */
export const playSnapshotAt = (graph: SceneGraph, steps: readonly ScenarioStep[], stepIndex: number): PlaySnapshot => {
  const index = Math.min(stepIndex, steps.length - 1);
  const step = steps[index] ?? null;
  if (!step) return EMPTY_PLAY_SNAPSHOT;
  return {
    step,
    activeCards: cardsOf(graph, [step]).map((card) => card.bounds),
    visitedCards: cardsOf(graph, steps.slice(0, index)).map((card) => card.bounds),
    litAreas: cardsOf(graph, steps.slice(0, index + 1)).map((card) => card.groupBounds),
  };
};
