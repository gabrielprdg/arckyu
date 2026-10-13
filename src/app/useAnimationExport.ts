import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useRef, useState } from "react";
import { downloadFile, exportAnimation, type AnimationExportRequest } from "../export/animationExport";

export type ExportStatus =
  | { kind: "idle" }
  | { kind: "running"; progress: number }
  | { kind: "done"; filename: string }
  | { kind: "error"; message: string };

const isAbort = (error: unknown): boolean => error instanceof DOMException && error.name === "AbortError";
const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Roda o export de animação com progresso e cancelamento; baixa o arquivo no fim. */
export const useAnimationExport = (api: ExcalidrawImperativeAPI | null) => {
  const [status, setStatus] = useState<ExportStatus>({ kind: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const start = useCallback(async (request: AnimationExportRequest) => {
    if (!api || controllerRef.current) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus({ kind: "running", progress: 0 });
    try {
      const file = await exportAnimation(api, request, (progress) => setStatus({ kind: "running", progress }), controller.signal);
      downloadFile(file);
      setStatus({ kind: "done", filename: file.filename });
    } catch (error) {
      setStatus(isAbort(error) ? { kind: "idle" } : { kind: "error", message: messageOf(error) });
    } finally {
      controllerRef.current = null;
    }
  }, [api]);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);
  const reset = useCallback(() => setStatus({ kind: "idle" }), []);
  return { status, start, cancel, reset };
};
