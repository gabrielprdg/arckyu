import type { Bounds, SceneGraph } from "../arch/sceneGraph";
import { playSnapshotAt } from "../flow/playSnapshot";
import { playMomentAt, type AnimationContent } from "./exportTimeline";
import { paintAmbientFrame, paintPlayFrame, type FlowTracks, type PaintSurface } from "./overlayPainter";

/** Cena pronta para pintar quadros: grafo, geometria das setas, área exportada e pixels por unidade. */
export type AnimationScene = { graph: SceneGraph; tracks: FlowTracks; area: Bounds; pixelScale: number };

/**
 * Pinta o quadro `timeMs` da animação escolhida (fundo ou play), em coordenadas de cena.
 * @example paintAnimationFrame(layerCtx, scene, { kind: "ambient", durationMs: 6000 }, 1000)
 */
export const paintAnimationFrame = (surface: PaintSurface, scene: AnimationScene, content: AnimationContent, timeMs: number): void => {
  if (content.kind === "ambient") return paintAmbientFrame(surface, scene.graph.flows, scene.tracks, timeMs);
  const moment = playMomentAt(content.steps.length, content.speed, timeMs);
  const snapshot = playSnapshotAt(scene.graph, content.steps, moment.stepIndex);
  paintPlayFrame(surface, scene.graph.flows, scene.tracks, { snapshot, progress: moment.progress, area: scene.area, pixelScale: scene.pixelScale });
};
