import { BufferTarget, CanvasSource, canEncodeVideo, Mp4OutputFormat, Output, QUALITY_HIGH, WebMOutputFormat, type VideoCodec } from "mediabunny";

/** Vídeo pronto para baixar. */
export type EncodedVideo = { blob: Blob; extension: string };

/** Quem desenha os quadros: o canvas que vira vídeo e como pintar o instante `timeMs` nele. */
export type FrameSource = { canvas: HTMLCanvasElement; render: (timeMs: number) => void };

export type EncodeOptions = {
  fps: number;
  frameTimesMs: readonly number[];
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
};

type Container = { codec: VideoCodec; format: () => Mp4OutputFormat | WebMOutputFormat };

// MP4/H.264 toca em tudo (PowerPoint, WhatsApp); WebM/VP9 é o plano B de navegadores sem H.264.
const CONTAINERS: readonly Container[] = [
  { codec: "avc", format: () => new Mp4OutputFormat({ fastStart: "in-memory" }) },
  { codec: "vp9", format: () => new WebMOutputFormat() },
];

const pickContainer = async (width: number, height: number): Promise<Container> => {
  for (const container of CONTAINERS) {
    if (await canEncodeVideo(container.codec, { width, height, quality: QUALITY_HIGH })) return container;
  }
  throw new Error(`este navegador não codifica vídeo ${width}x${height} (tentados: avc, vp9); tente 1080p ou outro navegador`);
};

const abortError = (): DOMException => new DOMException("export cancelado", "AbortError");

/**
 * Codifica os quadros no navegador (WebCodecs) e devolve o arquivo.
 * @example const video = await encodeVideo(frames, { fps: 30, frameTimesMs: frameTimesMs(6000, 30) });
 */
export const encodeVideo = async (source: FrameSource, options: EncodeOptions): Promise<EncodedVideo> => {
  const container = await pickContainer(source.canvas.width, source.canvas.height);
  const target = new BufferTarget();
  const output = new Output({ format: container.format(), target });
  const track = new CanvasSource(source.canvas, { codec: container.codec, quality: QUALITY_HIGH });
  output.addVideoTrack(track, { frameRate: options.fps });
  await output.start();
  for (const [index, timeMs] of options.frameTimesMs.entries()) {
    if (options.signal?.aborted) { await output.cancel(); throw abortError(); }
    source.render(timeMs);
    await track.add(timeMs / 1000, 1 / options.fps);
    options.onProgress?.((index + 1) / options.frameTimesMs.length);
  }
  await output.finalize();
  if (!target.buffer) throw new Error("o encoder terminou sem gerar o arquivo (buffer vazio)");
  return { blob: new Blob([target.buffer], { type: output.format.mimeType }), extension: output.format.fileExtension };
};
