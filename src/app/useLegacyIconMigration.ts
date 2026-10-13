import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useEffect, useRef } from "react";
import { iconFileDataFromUrl, remapImageFiles } from "../arch/excalidrawAdapter";
import { planLegacyIconMigration } from "../arch/legacyIcons";
import { toCanvasImage } from "../icons/rasterize";

type MigrationResult = "nothing-to-do" | "waiting-files" | "migrated";

const migrate = async (api: ExcalidrawImperativeAPI): Promise<MigrationResult> => {
  const plan = planLegacyIconMigration(api.getSceneElements());
  if (plan.size === 0) return "nothing-to-do";
  const files = api.getFiles();
  // Os arquivos chegam depois dos elementos na inicialização; sem eles, tenta de novo na próxima mudança.
  const ready = [...plan].filter(([oldId]) => files[oldId] !== undefined);
  if (ready.length === 0) return "waiting-files";
  const converted = await Promise.all(ready.map(async ([oldId, newId]) => iconFileDataFromUrl(newId, await toCanvasImage(files[oldId].dataURL))));
  api.addFiles(converted);
  remapImageFiles(api, new Map(ready));
  return "migrated";
};

const RETRY_MS = 250;
const MAX_ATTEMPTS = 20;

// Arquivos carregam sem mudar o hash dos elementos, então "esperar a próxima mudança" pode nunca acontecer.
const migrateWithRetry = async (api: ExcalidrawImperativeAPI): Promise<void> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const result = await migrate(api);
    if (result !== "waiting-files") return;
    await new Promise((resolve) => window.setTimeout(resolve, RETRY_MS));
  }
};

/** Converte para PNG os ícones salvos como SVG (ficavam com cor invertida no tema escuro). */
export const useLegacyIconMigration = (api: ExcalidrawImperativeAPI | null, sceneVersion: number): void => {
  const runningRef = useRef(false);
  useEffect(() => {
    if (!api || sceneVersion === 0 || runningRef.current) return;
    runningRef.current = true;
    void migrateWithRetry(api).finally(() => { runningRef.current = false; });
  }, [api, sceneVersion]);
};
