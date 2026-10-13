import { describe, expect, it } from "vitest";
import type { RenderFlow } from "../model/types";
import { antsDashOffset, antsLayersFor, dashCycleLength, flowCycleSeconds, packetFractions, packetProgress } from "./flowMath";

describe("dashCycleLength", () => {
  it("soma padrões pares", () => expect(dashCycleLength([8, 6])).toBe(14));
  it("dobra padrões ímpares, como o SVG repete a lista", () => expect(dashCycleLength([5])).toBe(10));
});

describe("flowCycleSeconds", () => {
  it("mantém a velocidade em px/s", () => expect(flowCycleSeconds([8, 6], 28)).toBe(0.5));
  it("rejeita velocidade não positiva informando o valor", () =>
    expect(() => flowCycleSeconds([8, 6], 0)).toThrow("recebido 0"));
  it("rejeita padrão vazio", () => expect(() => flowCycleSeconds([], 10)).toThrow("vazio"));
});

describe("packetProgress", () => {
  const base = { pathLength: 100, speed: 100, count: 2, reverse: false };
  it("anda proporcional ao tempo", () => expect(packetProgress({ ...base, elapsedMs: 500, index: 0 })).toBe(0.5));
  it("espaça pacotes igualmente", () => expect(packetProgress({ ...base, elapsedMs: 0, index: 1 })).toBe(0.5));
  it("dá a volta no fim do caminho", () => expect(packetProgress({ ...base, elapsedMs: 1250, index: 0 })).toBeCloseTo(0.25));
  it("inverte no sentido de volta", () =>
    expect(packetProgress({ ...base, reverse: true, elapsedMs: 250, index: 0 })).toBeCloseTo(0.75));
});

const flowOf = (patch: Partial<RenderFlow> = {}): RenderFlow =>
  ({ animated: true, direction: "forward", speed: 50, packets: true, color: "#e03131", width: 2, ...patch });

describe("antsDashOffset", () => {
  it("começa num ciclo inteiro e desce como a animação CSS", () => expect(antsDashOffset([8, 6], 28, "forward", 0)).toBe(14));
  it("anda speed px/s", () => expect(antsDashOffset([8, 6], 28, "forward", 250)).toBe(7));
  it("no sentido de volta cresce a partir de 0", () => expect(antsDashOffset([8, 6], 28, "backward", 250)).toBe(7));
});

describe("antsLayersFor", () => {
  it("sync usa brilho claro sobre o traço contínuo", () => expect(antsLayersFor(flowOf(), "sync")[0].stroke).toBe("#fff7ed"));
  it("both sobrepõe ida e volta com padrão espaçado", () =>
    expect(antsLayersFor(flowOf({ direction: "both" }), "async")).toEqual([
      { pattern: [8, 20], direction: "forward", stroke: "#e03131" },
      { pattern: [8, 20], direction: "backward", stroke: "#7dd3fc" },
    ]));
});

describe("packetFractions", () => {
  it("três bolinhas igualmente espaçadas", () => expect(packetFractions(flowOf(), 100, 0)).toEqual([0, 1 / 3, 2 / 3]));
  it("em both a bolinha do meio volta", () => expect(packetFractions(flowOf({ direction: "both" }), 100, 0)[1]).toBeCloseTo(2 / 3));
  it("anda no dobro da velocidade da seta", () => expect(packetFractions(flowOf(), 100, 250)[0]).toBeCloseTo(0.25));
});
