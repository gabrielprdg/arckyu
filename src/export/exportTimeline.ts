import { PLAY_STEP_MS } from "../flow/flowMath";
import type { ScenarioStep } from "../model/types";

/** Só a animação de fundo (bolinhas/traço) por um tempo fixo, ou o play de um cenário do início ao fim. */
export type AnimationContent =
  | { kind: "ambient"; durationMs: number }
  | { kind: "play"; steps: readonly ScenarioStep[]; speed: number };

/** Segura o último passo aceso antes do vídeo acabar (ou do SVG recomeçar). */
export const PLAY_HOLD_MS = 1500;

export type PlayMoment = { stepIndex: number; progress: number };

/**
 * Duração de um passo do play na velocidade escolhida.
 * @example playStepMs(2) // 550
 */
export const playStepMs = (speed: number): number => {
  if (!(speed > 0)) throw new RangeError(`velocidade do play deve ser > 0, recebido ${String(speed)}`);
  return PLAY_STEP_MS / speed;
};

/**
 * Duração total do que vai ser exportado, em ms.
 * @example animationDurationMs({ kind: "play", steps: [a, b], speed: 1 }) // 3700
 */
export const animationDurationMs = (content: AnimationContent): number =>
  content.kind === "ambient" ? content.durationMs : content.steps.length * playStepMs(content.speed) + PLAY_HOLD_MS;

/**
 * Passo e progresso (0..1) do pacote do play em `timeMs`; depois do fim fica no último passo, completo.
 * @example playMomentAt(3, 1, 1650) // { stepIndex: 1, progress: 0.5 }
 */
export const playMomentAt = (stepCount: number, speed: number, timeMs: number): PlayMoment => {
  const stepMs = playStepMs(speed);
  const time = Math.max(0, timeMs);
  const index = Math.floor(time / stepMs);
  if (index >= stepCount) return { stepIndex: Math.max(0, stepCount - 1), progress: 1 };
  return { stepIndex: index, progress: (time - index * stepMs) / stepMs };
};

/**
 * Instantes (ms) de cada quadro do vídeo; o último quadro cai antes do fim.
 * @example frameTimesMs(100, 30) // [0, 33.33…, 66.66…]
 */
export const frameTimesMs = (durationMs: number, fps: number): number[] => {
  if (!(fps > 0)) throw new RangeError(`fps deve ser > 0, recebido ${String(fps)}`);
  const count = Math.max(1, Math.ceil((durationMs * fps) / 1000));
  return Array.from({ length: count }, (_, frame) => (frame * 1000) / fps);
};
