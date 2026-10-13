import { describe, expect, it } from "vitest";
import { animationDurationMs, frameTimesMs, playMomentAt, playStepMs } from "./exportTimeline";

const steps = [{ edgeId: "e1", reverse: false }, { edgeId: "e2", reverse: false }];

describe("playStepMs", () => {
  it("encurta o passo na velocidade 2×", () => expect(playStepMs(2)).toBe(550));
  it("rejeita velocidade zero informando o valor", () => expect(() => playStepMs(0)).toThrow("recebido 0"));
});

describe("animationDurationMs", () => {
  it("fundo dura o que foi escolhido", () => expect(animationDurationMs({ kind: "ambient", durationMs: 8000 })).toBe(8000));
  it("play = passos + tempo segurando o fim", () => expect(animationDurationMs({ kind: "play", steps, speed: 1 })).toBe(3700));
});

describe("playMomentAt", () => {
  it("acha o passo e o progresso do pacote", () => expect(playMomentAt(3, 1, 1650)).toEqual({ stepIndex: 1, progress: 0.5 }));
  it("depois do fim segura o último passo completo", () => expect(playMomentAt(2, 1, 3000)).toEqual({ stepIndex: 1, progress: 1 }));
  it("tempo negativo fica no começo", () => expect(playMomentAt(2, 1, -10)).toEqual({ stepIndex: 0, progress: 0 }));
});

describe("frameTimesMs", () => {
  it("um quadro a cada 1/fps, sem passar do fim", () => expect(frameTimesMs(100, 30).map(Math.round)).toEqual([0, 33, 67]));
  it("um segundo a 30 fps tem 30 quadros", () => expect(frameTimesMs(1000, 30)).toHaveLength(30));
  it("rejeita fps zero", () => expect(() => frameTimesMs(1000, 0)).toThrow("recebido 0"));
});
