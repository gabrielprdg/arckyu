import { describe, expect, it } from "vitest";
import { exportRequestFrom, type ExportChoices } from "./exportRequest";

const choices: ExportChoices = { content: "ambient", scenarioIndex: 0, speed: 1, seconds: 8, format: "video", theme: "dark", longSidePx: 1920 };
const scenarios = [{ name: "Notificação (lote) → SNS", steps: [{ edgeId: "e1", reverse: false }] }, { name: "Vazio", steps: [] }];

describe("exportRequestFrom", () => {
  it("fundo vira duração em ms e tema escuro", () =>
    expect(exportRequestFrom(choices, scenarios)).toMatchObject({ ok: true, request: { content: { kind: "ambient", durationMs: 8000 }, dark: true, fps: 30, fileStem: "arckyu-animacao" } }));
  it("play nomeia o arquivo pelo cenário, sem acento", () =>
    expect(exportRequestFrom({ ...choices, content: "play" }, scenarios)).toMatchObject({ ok: true, request: { fileStem: "arckyu-play-notificacao-lote-sns" } }));
  it("recusa cenário sem passos", () =>
    expect(exportRequestFrom({ ...choices, content: "play", scenarioIndex: 1 }, scenarios)).toMatchObject({ ok: false }));
});
