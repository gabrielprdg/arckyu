import { hashElementsVersion } from "@excalidraw/excalidraw";
import type { OrderedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ScenarioBook } from "../app/scenarioBook";
import { belongsToOpenDrawing } from "./autosaveGuard";
import { createDebouncedWriter } from "./debouncedWriter";
import { encodeScene, type RawScene } from "./sceneCodec";
import { renderThumbnail } from "./thumbnail";

/** Desenho aberto: id, cena e cenários como vieram do armazenamento. */
export type AutosaveTarget = { id: string; sceneText: string; book: ScenarioBook; needsThumbnail: boolean };

export type AutosaveSinks = {
  saveContent: (id: string, scene: string, book: ScenarioBook) => Promise<void>;
  saveThumbnail: (id: string, thumbnail: string | null) => Promise<void>;
};

type ContentJob = { id: string; raw: RawScene | null; sceneText: string; book: ScenarioBook };

// Cada gravação sobe a cena inteira para a nuvem: agrupa uma sequência de edições numa só.
const CONTENT_DELAY_MS = 1500;
const THUMBNAIL_DELAY_MS = 2500;

// Versão "do desenho": elementos + quantidade de imagens. Rolar ou dar zoom não muda e não conta como edição.
const drawingVersion = (elements: readonly OrderedExcalidrawElement[], files: BinaryFiles): string =>
  `${hashElementsVersion(elements)}:${Object.keys(files).length}`;

const useWriters = (sinksRef: { current: AutosaveSinks }) =>
  useMemo(() => {
    const thumbnail = createDebouncedWriter(async (job: ContentJob) => {
      if (job.raw) await sinksRef.current.saveThumbnail(job.id, await renderThumbnail(job.raw));
    }, THUMBNAIL_DELAY_MS);
    const content = createDebouncedWriter(async (job: ContentJob) => {
      await sinksRef.current.saveContent(job.id, job.raw ? encodeScene(job.raw) : job.sceneText, job.book);
      thumbnail.schedule(job);
    }, CONTENT_DELAY_MS);
    const flush = async (): Promise<void> => { await content.flush(); await thumbnail.flush(); };
    return { content, thumbnail, flush };
  }, [sinksRef]);

/**
 * Salva o desenho aberto quando ele muda (cena ou cenários), com atraso; grava o pendente ao trocar de desenho ou esconder a aba.
 * @example const autosave = useDrawingAutosave(target, sinks); <Editor onSceneChange={autosave.onSceneChange} />
 */
export const useDrawingAutosave = (target: AutosaveTarget | null, sinks: AutosaveSinks) => {
  const sinksRef = useRef(sinks);
  sinksRef.current = sinks;
  const writers = useWriters(sinksRef);
  const jobRef = useRef<ContentJob | null>(null);
  const versionRef = useRef<string | null>(null);
  const needsThumbnailRef = useRef(false);

  useEffect(() => {
    jobRef.current = target ? { id: target.id, raw: null, sceneText: target.sceneText, book: target.book } : null;
    versionRef.current = null;
    needsThumbnailRef.current = target?.needsThumbnail ?? false;
    return () => void writers.flush();
  }, [target, writers]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === "hidden") void writers.flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [writers]);

  // Todo aviso diz de qual desenho é: o editor novo avisa no mount ANTES deste hook trocar de alvo (efeito do filho roda
  // antes do pai), e sem o id os cenários do desenho novo eram gravados no anterior.
  const onSceneChange = useCallback((drawingId: string, elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    const job = jobRef.current;
    if (!job || !belongsToOpenDrawing(job, drawingId)) return;
    const version = drawingVersion(elements, files);
    const isFirst = versionRef.current === null;
    const changed = !isFirst && versionRef.current !== version;
    versionRef.current = version;
    jobRef.current = { ...job, raw: { elements, appState, files } };
    if (changed) writers.content.schedule(jobRef.current);
    // Desenho migrado ou duplicado sem miniatura ganha uma ao abrir, sem contar como edição.
    if (isFirst && needsThumbnailRef.current) writers.thumbnail.schedule(jobRef.current);
  }, [writers]);

  const onBookChange = useCallback((drawingId: string, book: ScenarioBook) => {
    const job = jobRef.current;
    if (!job || !belongsToOpenDrawing(job, drawingId) || job.book === book) return;
    jobRef.current = { ...job, book };
    writers.content.schedule(jobRef.current);
  }, [writers]);

  return { onSceneChange, onBookChange, flush: writers.flush };
};
