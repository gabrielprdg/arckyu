import type { Bounds, FlowArrow, SceneGraph } from "../arch/sceneGraph";
import { antsLayersFor, dashCycleLength, flowCycleSeconds, PACKET_COUNT } from "../flow/flowMath";
import { playSnapshotAt } from "../flow/playSnapshot";
import type { ScenarioStep } from "../model/types";
import { PLAY_STYLE } from "../overlay/overlayStyle";
import { animationDurationMs, PLAY_HOLD_MS, playStepMs } from "./exportTimeline";

const ID = "arckyu";
const LOOP = `${ID}-loop`;
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

const num = (value: number): string => String(Math.round(value * 1000) / 1000);
const secs = (ms: number): string => `${num(ms / 1000)}s`;
const esc = (value: string): string => value.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);
const rectAttrs = (b: Bounds, pad = 0): string =>
  `x="${num(b.x - pad)}" y="${num(b.y - pad)}" width="${num(b.width + pad * 2)}" height="${num(b.height + pad * 2)}"`;

const motion = (path: string, durMs: number, begin: string, reverse: boolean, repeat: string): string =>
  `<animateMotion path="${esc(path)}" dur="${secs(durMs)}" begin="${begin}" ${repeat}${reverse ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : ""}/>`;

// Mesmo stroke-dashoffset da animação CSS da tela (de um ciclo até 0).
const antsMarkup = (flow: FlowArrow): string =>
  antsLayersFor(flow.flow, flow.communication).map((layer) => {
    const cycle = dashCycleLength(layer.pattern);
    const [from, to] = layer.direction === "forward" ? [cycle, 0] : [0, cycle];
    const dur = num(flowCycleSeconds(layer.pattern, flow.flow.speed));
    return `<path d="${esc(flow.path)}" fill="none" stroke="${esc(layer.stroke)}" stroke-width="${num(flow.flow.width)}" stroke-dasharray="${layer.pattern.join(" ")}" stroke-linecap="round">` +
      `<animate attributeName="stroke-dashoffset" from="${from}" to="${to}" dur="${dur}s" repeatCount="indefinite"/></path>`;
  }).join("");

// begin negativo espaça as bolinhas como o packetProgress da tela (index / count do caminho).
const packetsMarkup = (flow: FlowArrow, length: number): string => {
  if (length <= 0 || !(flow.flow.speed > 0)) return "";
  const durMs = (length / (flow.flow.speed * 2)) * 1000;
  return Array.from({ length: PACKET_COUNT }, (_, index) => {
    const reverse = flow.flow.direction === "backward" || (flow.flow.direction === "both" && index % 2 === 1);
    const begin = secs(-(index / PACKET_COUNT) * durMs);
    return `<circle r="${num(flow.flow.width + 2)}" fill="${esc(flow.flow.color)}">${motion(flow.path, durMs, begin, reverse, 'repeatCount="indefinite"')}</circle>`;
  }).join("");
};

/**
 * Bolinhas e traço em movimento de cada seta, em SMIL (loop infinito, coordenadas de cena).
 * @example ambientSvgMarkup(graph.flows, new Map([["seta-1", 240]]))
 */
export const ambientSvgMarkup = (flows: readonly FlowArrow[], lengths: ReadonlyMap<string, number>): string =>
  flows.map((flow) => (flow.flow.animated ? antsMarkup(flow) : "") + (flow.flow.packets ? packetsMarkup(flow, lengths.get(flow.id) ?? 0) : "")).join("");

type StepContext = { graph: SceneGraph; steps: readonly ScenarioStep[]; stepMs: number; area: Bounds };

const spotlightMarkup = (index: number, area: Bounds, lit: readonly Bounds[]): string => {
  const maskId = `${ID}-lit-${index}`;
  const holes = lit.map((b) => `<rect ${rectAttrs(b, PLAY_STYLE.litPadding)} rx="16" fill="#000"/>`).join("");
  return `<mask id="${maskId}" maskUnits="userSpaceOnUse" ${rectAttrs(area)}><rect ${rectAttrs(area)} fill="#fff"/>${holes}</mask>` +
    `<rect ${rectAttrs(area)} fill="#fff" fill-opacity=".72" mask="url(#${maskId})"/>`;
};

const glowMarkup = (bounds: Bounds, active: boolean): string =>
  `<rect ${rectAttrs(bounds, PLAY_STYLE.glowPadding)} rx="16" fill="none" stroke-width="3" ` +
  (active ? `stroke="${PLAY_STYLE.ok}" filter="url(#${ID}-glow)"/>` : `stroke="${PLAY_STYLE.visited}" stroke-dasharray="6 4"/>`);

const requestMarkup = (flow: FlowArrow, reverse: boolean, begin: string, stepMs: number): string =>
  `<path d="${esc(flow.path)}" fill="none" stroke="${PLAY_STYLE.ok}" stroke-width="${num(flow.flow.width + 2)}" stroke-linecap="round" opacity=".9"/>` +
  `<g>${motion(flow.path, stepMs, begin, reverse, 'fill="freeze"')}` +
  `<circle r="${PLAY_STYLE.haloRadius}" fill="${PLAY_STYLE.ok}" fill-opacity=".2" stroke="${PLAY_STYLE.ok}" stroke-width="1"/>` +
  `<circle r="${PLAY_STYLE.coreRadius}" fill="${PLAY_STYLE.ok}" filter="url(#${ID}-glow)"/></g>`;

// Cada passo é um grupo que só aparece na sua janela de tempo; o último segura até o fim do loop.
const stepMarkup = (context: StepContext, index: number): string => {
  const snapshot = playSnapshotAt(context.graph, context.steps, index);
  const begin = `${LOOP}.begin+${secs(index * context.stepMs)}`;
  const visibleMs = context.stepMs + (index === context.steps.length - 1 ? PLAY_HOLD_MS : 0);
  const step = snapshot.step;
  const flow = step ? context.graph.flows.find((item) => item.id === step.edgeId) : undefined;
  return `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${begin}" dur="${secs(visibleMs)}"/>` +
    spotlightMarkup(index, context.area, snapshot.litAreas) +
    snapshot.visitedCards.map((b) => glowMarkup(b, false)).join("") +
    snapshot.activeCards.map((b) => glowMarkup(b, true)).join("") +
    (step && flow ? requestMarkup(flow, step.reverse, begin, context.stepMs) : "") + "</g>";
};

/**
 * Play do cenário em SMIL: um relógio mestre reinicia a sequência de passos em loop.
 * @example playSvgMarkup(graph, scenario.steps, 1, exportArea(elements))
 */
export const playSvgMarkup = (graph: SceneGraph, steps: readonly ScenarioStep[], speed: number, area: Bounds): string => {
  const stepMs = playStepMs(speed);
  const totalMs = animationDurationMs({ kind: "play", steps, speed });
  const clock = `<rect width="0" height="0"><animate id="${LOOP}" attributeName="x" from="0" to="0" dur="${secs(totalMs)}" begin="0s;${LOOP}.end"/></rect>`;
  const glow = `<defs><filter id="${ID}-glow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${PLAY_STYLE.ok}"/></filter></defs>`;
  const context: StepContext = { graph, steps, stepMs, area };
  return glow + clock + steps.map((_, index) => stepMarkup(context, index)).join("");
};
