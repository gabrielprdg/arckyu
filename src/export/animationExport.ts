import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { Bounds } from "../arch/sceneGraph";
import { buildSceneGraph } from "../arch/sceneGraph";
import { ambientSvgMarkup, playSvgMarkup } from "./animatedSvgMarkup";
import { paintAnimationFrame, type AnimationScene } from "./animationFrame";
import { createDomTracks } from "./domTracks";
import { animationDurationMs, frameTimesMs, type AnimationContent } from "./exportTimeline";
import { createFrameCompositor } from "./frameCompositor";
import { exportArea, rasterizeScene, sceneToSvg, type SceneSource } from "./sceneRaster";
import { encodeVideo } from "./videoEncoder";

export type ExportFormat = "video" | "svg";

/** O que o usuário escolheu no modal. `longSidePx` só vale para vídeo. */
export type AnimationExportRequest = { content: AnimationContent; format: ExportFormat; dark: boolean; longSidePx: number; fps: number; fileStem: string };

export type ExportedFile = { blob: Blob; filename: string };

type ExportRun = { source: SceneSource; scene: Omit<AnimationScene, "pixelScale">; request: AnimationExportRequest };

const SVG_NS = "http://www.w3.org/2000/svg";

const sceneSourceOf = (api: ExcalidrawImperativeAPI): SceneSource =>
  ({ elements: api.getSceneElements(), files: api.getFiles(), viewBackgroundColor: api.getAppState().viewBackgroundColor });

const exportVideo = async (run: ExportRun, onProgress: (fraction: number) => void, signal: AbortSignal): Promise<ExportedFile> => {
  const { area } = run.scene;
  const { request } = run;
  const scale = request.longSidePx / Math.max(area.width, area.height);
  const background = await rasterizeScene(run.source, request.dark, scale);
  const scene: AnimationScene = { ...run.scene, pixelScale: scale };
  const frames = createFrameCompositor({ background, area, scale, dark: request.dark,
    paint: (surface, timeMs) => paintAnimationFrame(surface, scene, request.content, timeMs) });
  const times = frameTimesMs(animationDurationMs(request.content), request.fps);
  const video = await encodeVideo(frames, { fps: request.fps, frameTimesMs: times, onProgress, signal });
  return { blob: video.blob, filename: `${request.fileStem}${video.extension}` };
};

// Markup da camada entra num <g> deslocado: o SVG do Excalidraw começa em 0,0 no canto da área exportada.
const appendOverlay = (base: SVGSVGElement, area: Bounds, markup: string): void => {
  const parsed = new DOMParser().parseFromString(`<svg xmlns="${SVG_NS}"><g transform="translate(${-area.x} ${-area.y})">${markup}</g></svg>`, "image/svg+xml");
  const group = parsed.documentElement.firstElementChild;
  if (!group || parsed.querySelector("parsererror")) throw new Error(`camada animada gerou SVG inválido (${markup.slice(0, 80)}…)`);
  base.append(base.ownerDocument.importNode(group, true));
};

const exportSvg = async (run: ExportRun): Promise<ExportedFile> => {
  const { graph, tracks, area } = run.scene;
  const { content, dark, fileStem } = run.request;
  const base = await sceneToSvg(run.source, dark);
  const lengths = new Map([...tracks].map(([id, track]) => [id, track.length] as const));
  const markup = content.kind === "ambient" ? ambientSvgMarkup(graph.flows, lengths) : playSvgMarkup(graph, content.steps, content.speed, area);
  appendOverlay(base, area, markup);
  const text = new XMLSerializer().serializeToString(base);
  return { blob: new Blob([text], { type: "image/svg+xml" }), filename: `${fileStem}.svg` };
};

/**
 * Exporta a animação de fundo ou o play de um cenário como vídeo (MP4/WebM) ou SVG animado.
 * @example const file = await exportAnimation(api, request, setProgress, controller.signal); downloadFile(file);
 */
export const exportAnimation = async (api: ExcalidrawImperativeAPI, request: AnimationExportRequest,
  onProgress: (fraction: number) => void, signal: AbortSignal): Promise<ExportedFile> => {
  const source = sceneSourceOf(api);
  if (source.elements.length === 0) throw new Error("a cena está vazia: nada para exportar");
  const graph = buildSceneGraph(source.elements);
  const { tracks, dispose } = createDomTracks(graph.flows);
  try {
    const run: ExportRun = { source, scene: { graph, tracks, area: exportArea(source.elements) }, request };
    return request.format === "svg" ? await exportSvg(run) : await exportVideo(run, onProgress, signal);
  } finally {
    dispose();
  }
};

/** Baixa o arquivo pelo navegador (link temporário). */
export const downloadFile = (file: ExportedFile): void => {
  const url = URL.createObjectURL(file.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
