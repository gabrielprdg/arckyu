import type { Communication, FlowDirection, RenderFlow } from "../model/types";

/** Bolinhas por seta na animação de fundo. */
export const PACKET_COUNT = 3;
/** Duração de um passo do play a 1×. */
export const PLAY_STEP_MS = 1100;

/** Padrão do traço base: async é tracejado, sync é contínuo. */
export const baseDashFor = (communication: Communication): number[] =>
  communication === "async" ? [8, 6] : [];

/** Padrão das "formigas" desenhadas por cima da aresta quando animada. */
export const antsDashFor = (communication: Communication): number[] =>
  communication === "async" ? [8, 6] : [3, 13];

/**
 * Comprimento de um ciclo do padrão; ímpar se repete para fechar o par (regra do SVG).
 * @example dashCycleLength([8, 6]) // 14
 */
export const dashCycleLength = (pattern: readonly number[]): number => {
  const sum = pattern.reduce((total, value) => total + value, 0);
  return pattern.length % 2 === 0 ? sum : sum * 2;
};

/**
 * Duração de um ciclo para que a velocidade aparente seja `speed` px/s.
 * @example flowCycleSeconds([8, 6], 28) // 0.5
 */
export const flowCycleSeconds = (pattern: readonly number[], speed: number): number => {
  if (!(speed > 0)) {
    throw new RangeError(`speed deve ser > 0 px/s, recebido ${String(speed)}`);
  }
  const cycle = dashCycleLength(pattern);
  if (cycle === 0) {
    throw new RangeError(`padrão de traço vazio ou zerado: [${pattern.join(", ")}]`);
  }
  return cycle / speed;
};

export const cssDirectionFor = (direction: Exclude<FlowDirection, "both">): "normal" | "reverse" =>
  direction === "forward" ? "normal" : "reverse";

/**
 * Posição (0..1) do pacote `index` de `count`, igualmente espaçados, após `elapsedMs`.
 * @example packetProgress({ elapsedMs: 500, pathLength: 100, speed: 100, index: 0, count: 2, reverse: false }) // 0.5
 */
export const packetProgress = (params: {
  elapsedMs: number;
  pathLength: number;
  speed: number;
  index: number;
  count: number;
  reverse: boolean;
}): number => {
  const { elapsedMs, pathLength, speed, index, count, reverse } = params;
  if (pathLength <= 0) return 0;
  const travelled = (elapsedMs / 1000) * speed / pathLength;
  const progress = (travelled + index / count) % 1;
  return reverse ? 1 - progress : progress;
};

type AntsDirection = Exclude<FlowDirection, "both">;
export type AntsLayer = { pattern: number[]; direction: AntsDirection; stroke: string };

/** Camadas de traço em movimento da seta; "both" sobrepõe ida (cor da seta) e volta (azul). */
export const antsLayersFor = (flow: RenderFlow, communication: Communication): AntsLayer[] => {
  const pattern = antsDashFor(communication);
  // Em sync o traço base é contínuo, então as formigas viram "brilhos" claros por cima.
  const stroke = communication === "sync" ? "#fff7ed" : flow.color;
  if (flow.direction !== "both") return [{ pattern, direction: flow.direction, stroke }];
  const sparse = [pattern[0], pattern[0] + pattern[1] * 2];
  return [{ pattern: sparse, direction: "forward", stroke }, { pattern: sparse, direction: "backward", stroke: "#7dd3fc" }];
};

/**
 * stroke-dashoffset do traço após `elapsedMs`, igual à animação CSS (de um ciclo até 0, em loop).
 * @example antsDashOffset([8, 6], 28, "forward", 250) // 7
 */
export const antsDashOffset = (pattern: readonly number[], speed: number, direction: AntsDirection, elapsedMs: number): number => {
  const cycle = dashCycleLength(pattern);
  if (cycle === 0) return 0;
  const moved = ((elapsedMs / 1000) * speed) % cycle;
  return direction === "forward" ? cycle - moved : moved;
};

/**
 * Posição (0..1) de cada bolinha da seta; em "both" as ímpares voltam.
 * @example packetFractions(flow, 200, 0) // [0, 0.333…, 0.666…]
 */
export const packetFractions = (flow: RenderFlow, pathLength: number, elapsedMs: number): number[] =>
  Array.from({ length: PACKET_COUNT }, (_, index) => {
    const reverse = flow.direction === "backward" || (flow.direction === "both" && index % 2 === 1);
    return packetProgress({ elapsedMs, pathLength, speed: flow.speed * 2, index, count: PACKET_COUNT, reverse });
  });
