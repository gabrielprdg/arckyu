import { DARK_THEME_FILTER } from "../overlay/overlayStyle";
import type { Bounds } from "../arch/sceneGraph";
import type { PaintSurface } from "./overlayPainter";

/** Quadro do vídeo: diagrama estático por baixo + camada animada por cima, já no tamanho final. */
export type FrameCompositor = { canvas: HTMLCanvasElement; render: (timeMs: number) => void };

type CompositorOptions = {
  background: HTMLCanvasElement;
  area: Bounds;
  scale: number;
  dark: boolean;
  paint: (surface: PaintSurface, timeMs: number) => void;
};

// H.264 exige largura e altura pares.
const even = (value: number): number => Math.max(2, Math.floor(value / 2) * 2);

const context2d = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`canvas 2D indisponível (${canvas.width}x${canvas.height})`);
  return context;
};

const sizedCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Monta cada quadro: fundo do Excalidraw + camada pintada em coordenadas de cena (filtro do tema escuro igual à tela).
 * @example const frames = createFrameCompositor({ background, area, scale, dark, paint }); frames.render(500);
 */
export const createFrameCompositor = ({ background, area, scale, dark, paint }: CompositorOptions): FrameCompositor => {
  const canvas = sizedCanvas(even(background.width), even(background.height));
  const layer = sizedCanvas(canvas.width, canvas.height);
  const frame = context2d(canvas);
  const overlay = context2d(layer);
  const render = (timeMs: number): void => {
    overlay.setTransform(1, 0, 0, 1, 0, 0);
    overlay.clearRect(0, 0, layer.width, layer.height);
    overlay.setTransform(scale, 0, 0, scale, -area.x * scale, -area.y * scale);
    paint(overlay, timeMs);
    frame.filter = "none";
    frame.drawImage(background, 0, 0);
    frame.filter = dark ? DARK_THEME_FILTER : "none";
    frame.drawImage(layer, 0, 0);
    frame.filter = "none";
  };
  return { canvas, render };
};
