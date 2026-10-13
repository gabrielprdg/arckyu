export const RASTER_SIZE = 256;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`imagem não carregou para rasterizar (${src.slice(0, 40)}…)`));
    img.src = src;
  });

/** Encaixa a imagem num quadrado sem distorcer (contain), centralizada. */
export const containRect = (width: number, height: number, box: number): { x: number; y: number; w: number; h: number } => {
  const scale = box / Math.max(width || box, height || box);
  const w = (width || box) * scale;
  const h = (height || box) * scale;
  return { x: (box - w) / 2, y: (box - h) / 2, w, h };
};

export const isSvgDataUrl = (dataUrl: string): boolean => dataUrl.startsWith("data:image/svg+xml");

const OPAQUE_ALPHA = 32;
// Medido nos logos do Iconify: escuros ficam < 0.1 (Kafka 0.099, GitHub 0.086, Vercel 0); coloridos > 0.3 (Redis 0.316).
export const DARK_LOGO_LUMINANCE = 0.2;
const BACKDROP_COLOR = "#f1f3f5";
const BACKDROP_INSET = 0.16;

/**
 * Luminância média (0..1) dos pixels visíveis de um RGBA; null se a imagem é toda transparente.
 * @example meanLuminance([0, 0, 0, 255]) // 0
 */
export const meanLuminance = (rgba: ArrayLike<number>): number | null => {
  let total = 0;
  let count = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < OPAQUE_ALPHA) continue;
    total += (0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) / 255;
    count += 1;
  }
  return count === 0 ? null : total / count;
};

/** Logo escuro (Kafka, GitHub, Next.js…) some no tema escuro; esses ganham fundo claro. */
export const needsBackdrop = (luminance: number | null): boolean => luminance !== null && luminance < DARK_LOGO_LUMINANCE;

const drawContained = (context: CanvasRenderingContext2D, img: HTMLImageElement, box: number, offset = 0): void => {
  const rect = containRect(img.naturalWidth, img.naturalHeight, box);
  context.drawImage(img, offset + rect.x, offset + rect.y, rect.w, rect.h);
};

const drawWithBackdrop = (context: CanvasRenderingContext2D, img: HTMLImageElement, size: number): void => {
  context.clearRect(0, 0, size, size);
  context.fillStyle = BACKDROP_COLOR;
  context.beginPath();
  context.roundRect(0, 0, size, size, size * 0.2);
  context.fill();
  const inset = size * BACKDROP_INSET;
  drawContained(context, img, size - inset * 2, inset);
};

/**
 * Converte o ícone em PNG quadrado. Motivo: no tema escuro o Excalidraw 0.18 só corrige a cor de imagens
 * raster (shouldResetImageFilter); SVG fica invertido e o logo perde as cores reais.
 * @example await toCanvasImage("data:image/svg+xml;base64,...") // "data:image/png;base64,..."
 */
export const toCanvasImage = async (dataUrl: string, size = RASTER_SIZE): Promise<string> => {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas 2D indisponível para rasterizar o ícone");
  drawContained(context, img, size);
  if (needsBackdrop(meanLuminance(context.getImageData(0, 0, size, size).data))) drawWithBackdrop(context, img, size);
  return canvas.toDataURL("image/png");
};
