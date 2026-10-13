import type { GraphEdge, ScenarioStep } from "../model/types";

const stepBetween = (from: string, to: string, edges: readonly GraphEdge[]): ScenarioStep | null => {
  const forward = edges.find((edge) => edge.source === from && edge.target === to);
  if (forward) return { edgeId: forward.id, reverse: false };
  const backward = edges.find((edge) => edge.source === to && edge.target === from);
  return backward ? { edgeId: backward.id, reverse: true } : null;
};

const neighborsOf = (nodeId: string, edges: readonly GraphEdge[]): string[] =>
  edges.flatMap((edge) => {
    if (edge.source === nodeId) return [edge.target];
    if (edge.target === nodeId) return [edge.source];
    return [];
  });

/** Menor caminho (BFS, ignorando direção) entre dois nós; null se não houver. */
export const shortestNodePath = (
  from: string,
  to: string,
  edges: readonly GraphEdge[],
): string[] | null => {
  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    if (current === to) return rebuildPath(previous, to);
    for (const next of neighborsOf(current, edges)) {
      if (previous.has(next)) continue;
      previous.set(next, current);
      queue.push(next);
    }
  }
  return null;
};

const rebuildPath = (previous: Map<string, string | null>, to: string): string[] => {
  const path: string[] = [];
  for (let node: string | null = to; node !== null; node = previous.get(node) ?? null) {
    path.unshift(node);
  }
  return path;
};

const stepsForHop = (from: string, to: string, edges: readonly GraphEdge[]): ScenarioStep[] => {
  const path = shortestNodePath(from, to, edges);
  if (path === null) {
    throw new Error(`sem conexão entre "${from}" e "${to}"; ligue os nós antes de gravar o cenário`);
  }
  return path.slice(1).flatMap((node, i) => {
    const step = stepBetween(path[i], node, edges);
    return step ? [step] : [];
  });
};

/**
 * Converte a sequência de nós clicados em passos de cenário, preenchendo saltos com o menor caminho.
 * @example buildScenarioSteps(["user", "cdn", "api"], edges) // [{edgeId:"e1",reverse:false}, {edgeId:"e2",reverse:false}]
 */
export const buildScenarioSteps = (
  nodeIds: readonly string[],
  edges: readonly GraphEdge[],
): ScenarioStep[] =>
  nodeIds.slice(1).flatMap((nodeId, i) => {
    const direct = stepBetween(nodeIds[i], nodeId, edges);
    return direct ? [direct] : stepsForHop(nodeIds[i], nodeId, edges);
  });

/** Nós de origem e destino de um passo, respeitando o sentido. */
export const stepEndpoints = (
  step: ScenarioStep,
  edges: readonly GraphEdge[],
): { from: string; to: string } | null => {
  const edge = edges.find((candidate) => candidate.id === step.edgeId);
  if (!edge) return null;
  return step.reverse ? { from: edge.target, to: edge.source } : { from: edge.source, to: edge.target };
};
