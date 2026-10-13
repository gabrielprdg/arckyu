import { describe, expect, it } from "vitest";
import { playerReducer, type PlayerState } from "./playerReducer";

const state = (patch: Partial<PlayerState>): PlayerState => ({ status: "idle", stepIndex: 0, totalSteps: 3, ...patch });

describe("playerReducer", () => {
  it("play a partir do idle começa no passo 0", () =>
    expect(playerReducer(state({ stepIndex: 2 }), { type: "play" })).toMatchObject({ status: "playing", stepIndex: 0 }));
  it("não toca cenário vazio", () => expect(playerReducer(state({ totalSteps: 0 }), { type: "play" }).status).toBe("idle"));
  it("pause e retomada preservam o passo", () => {
    const paused = playerReducer(state({ status: "playing", stepIndex: 1 }), { type: "pause" });
    expect(playerReducer(paused, { type: "play" })).toMatchObject({ status: "playing", stepIndex: 1 });
  });
  it("stepFinished avança e termina no último", () => {
    const last = playerReducer(state({ status: "playing", stepIndex: 1 }), { type: "stepFinished" });
    expect(last.stepIndex).toBe(2);
    expect(playerReducer(last, { type: "stepFinished" }).status).toBe("done");
  });
  it("stepFinished é ignorado quando pausado", () =>
    expect(playerReducer(state({ status: "paused", stepIndex: 1 }), { type: "stepFinished" }).stepIndex).toBe(1));
  it("prev não passa de zero", () => expect(playerReducer(state({}), { type: "prev" }).stepIndex).toBe(0));
});
