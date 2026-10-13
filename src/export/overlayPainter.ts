import type { Bounds, FlowArrow } from "../arch/sceneGraph";
import { antsDashOffset, antsLayersFor, packetFractions } from "../flow/flowMath";
import type { PlaySnapshot } from "../flow/playSnapshot";
import { PLAY_STYLE } from "../overlay/overlayStyle";

/** Parte do contexto 2D que o export usa (facilita o fake nos testes). */
export type PaintSurface = Pick<CanvasRenderingContext2D,
  "save" | "restore" | "beginPath" | "arc" | "fill" | "stroke" | "setLineDash" | "roundRect" | "fillRect" |
  "fillStyle" | "strokeStyle" | "lineWidth" | "lineCap" | "lineDashOffset" | "globalAlpha" | "globalCompositeOperation" |
  "shadowBlur" | "shadowColor">;

export type TrackPoint = { x: number; y: number };

/** Geometria de uma seta em coordenadas de cena: comprimento, ponto no caminho e traço no canvas. */
export type FlowTrack = { length: number; pointAt: (fraction: number) => TrackPoint; strokeOn: (surface: PaintSurface) => void };
export type FlowTracks = ReadonlyMap<string, FlowTrack>;

/** Um quadro do play: estado do passo, progresso do pacote e a área toda (para o esmaecimento). */
export type PlayFrame = { snapshot: PlaySnapshot; progress: number; area: Bounds; pixelScale: number };

const CARD_RADIUS = 16;

const dot = (surface: PaintSurface, point: TrackPoint, radius: number, fill: string): void => {
  surface.beginPath();
  surface.arc(point.x, point.y, radius, 0, Math.PI * 2);
  surface.fillStyle = fill;
  surface.fill();
};

const paddedRect = (surface: PaintSurface, bounds: Bounds, pad: number): void => {
  surface.beginPath();
  surface.roundRect(bounds.x - pad, bounds.y - pad, bounds.width + pad * 2, bounds.height + pad * 2, CARD_RADIUS);
};

const paintAnts = (surface: PaintSurface, flow: FlowArrow, track: FlowTrack, timeMs: number): void => {
  for (const layer of antsLayersFor(flow.flow, flow.communication)) {
    surface.save();
    surface.setLineDash(layer.pattern);
    surface.lineDashOffset = antsDashOffset(layer.pattern, flow.flow.speed, layer.direction, timeMs);
    surface.strokeStyle = layer.stroke;
    surface.lineWidth = flow.flow.width;
    surface.lineCap = "round";
    track.strokeOn(surface);
    surface.restore();
  }
};

const paintPackets = (surface: PaintSurface, flow: FlowArrow, track: FlowTrack, timeMs: number): void =>
  packetFractions(flow.flow, track.length, timeMs).forEach((fraction) => dot(surface, track.pointAt(fraction), flow.flow.width + 2, flow.flow.color));

/**
 * Animação de fundo no instante `timeMs`: traço em movimento e bolinhas de cada seta.
 * @example paintAmbientFrame(ctx, graph.flows, tracks, 500)
 */
export const paintAmbientFrame = (surface: PaintSurface, flows: readonly FlowArrow[], tracks: FlowTracks, timeMs: number): void => {
  for (const flow of flows) {
    const track = tracks.get(flow.id);
    if (!track) continue;
    if (flow.flow.animated) paintAnts(surface, flow, track, timeMs);
    if (flow.flow.packets) paintPackets(surface, flow, track, timeMs);
  }
};

// Esmaece tudo e "fura" as áreas acesas (o pintor desenha numa camada própria, então destination-out é seguro).
const paintSpotlight = (surface: PaintSurface, area: Bounds, lit: readonly Bounds[]): void => {
  surface.save();
  surface.fillStyle = PLAY_STYLE.spotlight;
  surface.fillRect(area.x, area.y, area.width, area.height);
  surface.globalCompositeOperation = "destination-out";
  surface.fillStyle = "#000";
  lit.forEach((bounds) => { paddedRect(surface, bounds, PLAY_STYLE.litPadding); surface.fill(); });
  surface.restore();
};

const paintGlow = (surface: PaintSurface, bounds: Bounds, active: boolean, pixelScale: number): void => {
  surface.save();
  paddedRect(surface, bounds, PLAY_STYLE.glowPadding);
  surface.lineWidth = 3;
  surface.strokeStyle = active ? PLAY_STYLE.ok : PLAY_STYLE.visited;
  if (active) { surface.shadowColor = PLAY_STYLE.ok; surface.shadowBlur = 6 * pixelScale; }
  else surface.setLineDash([6, 4]);
  surface.stroke();
  surface.restore();
};

const paintPacketHead = (surface: PaintSurface, point: TrackPoint, pixelScale: number): void => {
  dot(surface, point, PLAY_STYLE.haloRadius, PLAY_STYLE.packetHalo);
  surface.strokeStyle = PLAY_STYLE.ok;
  surface.lineWidth = 1;
  surface.stroke();
  surface.save();
  surface.shadowColor = PLAY_STYLE.ok;
  surface.shadowBlur = 5 * pixelScale;
  dot(surface, point, PLAY_STYLE.coreRadius, PLAY_STYLE.ok);
  surface.restore();
};

const paintRequest = (surface: PaintSurface, flow: FlowArrow, track: FlowTrack, reverse: boolean, frame: PlayFrame): void => {
  surface.save();
  surface.strokeStyle = PLAY_STYLE.ok;
  surface.lineWidth = flow.flow.width + 2;
  surface.lineCap = "round";
  surface.globalAlpha = 0.9;
  track.strokeOn(surface);
  surface.restore();
  paintPacketHead(surface, track.pointAt(reverse ? 1 - frame.progress : frame.progress), frame.pixelScale);
};

/**
 * Um quadro do play: esmaecimento, brilho dos cards, seta ativa e o pacote no progresso do passo.
 * @example paintPlayFrame(ctx, graph.flows, tracks, { snapshot, progress: 0.5, area, pixelScale: 2 })
 */
export const paintPlayFrame = (surface: PaintSurface, flows: readonly FlowArrow[], tracks: FlowTracks, frame: PlayFrame): void => {
  const { snapshot } = frame;
  paintSpotlight(surface, frame.area, snapshot.litAreas);
  snapshot.visitedCards.forEach((bounds) => paintGlow(surface, bounds, false, frame.pixelScale));
  snapshot.activeCards.forEach((bounds) => paintGlow(surface, bounds, true, frame.pixelScale));
  const step = snapshot.step;
  const flow = step ? flows.find((item) => item.id === step.edgeId) : undefined;
  const track = flow ? tracks.get(flow.id) : undefined;
  if (step && flow && track) paintRequest(surface, flow, track, step.reverse, frame);
};
