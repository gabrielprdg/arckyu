import type { Scenario } from "../model/types";
import type { AnimationExportRequest, ExportFormat } from "./animationExport";
import type { AnimationContent } from "./exportTimeline";

/** Escolhas do modal "Exportar animação". */
export type ExportChoices = {
  content: "ambient" | "play";
  scenarioIndex: number;
  speed: number;
  seconds: number;
  format: ExportFormat;
  theme: "light" | "dark";
  longSidePx: number;
};

export const EXPORT_FPS = 30;

const slug = (name: string): string =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48).replace(/^-|-$/g, "") || "cenario";

/**
 * Converte as escolhas em pedido de export; erro (texto para o usuário) se o play não tiver cenário com passos.
 * @example exportRequestFrom({ content: "ambient", seconds: 8, … }, []) // { ok: true, request: { content: { kind: "ambient", durationMs: 8000 }, … } }
 */
export const exportRequestFrom = (choices: ExportChoices, scenarios: readonly Scenario[]):
  { ok: true; request: AnimationExportRequest } | { ok: false; error: string } => {
  const base = { format: choices.format, dark: choices.theme === "dark", longSidePx: choices.longSidePx, fps: EXPORT_FPS };
  if (choices.content === "ambient") {
    return { ok: true, request: { ...base, content: { kind: "ambient", durationMs: choices.seconds * 1000 }, fileStem: "arckyu-animacao" } };
  }
  const scenario = scenarios[choices.scenarioIndex];
  if (!scenario || scenario.steps.length === 0) return { ok: false, error: "Escolha um cenário com pelo menos um passo para exportar o play." };
  const content: AnimationContent = { kind: "play", steps: scenario.steps, speed: choices.speed };
  return { ok: true, request: { ...base, content, fileStem: `arckyu-play-${slug(scenario.name)}` } };
};
