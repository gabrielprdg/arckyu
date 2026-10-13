import { describe, expect, it } from "vitest";
import type { GraphEdge } from "../model/types";
import { buildScenarioSteps, shortestNodePath, stepEndpoints } from "./scenario";

const edge = (id: string, source: string, target: string): GraphEdge => ({ id, source, target });
const edges = [edge("e1", "user", "cdn"), edge("e2", "cdn", "api"), edge("e3", "api", "db"), edge("e4", "x", "y")];

describe("buildScenarioSteps", () => {
  it("usa a aresta direta no sentido de ida", () =>
    expect(buildScenarioSteps(["user", "cdn"], edges)).toEqual([{ edgeId: "e1", reverse: false }]));
  it("marca reverse quando o clique vai contra a aresta (resposta)", () =>
    expect(buildScenarioSteps(["api", "cdn"], edges)).toEqual([{ edgeId: "e2", reverse: true }]));
  it("preenche saltos com o menor caminho", () =>
    expect(buildScenarioSteps(["user", "db"], edges).map((s) => s.edgeId)).toEqual(["e1", "e2", "e3"]));
  it("explica quando não há caminho", () =>
    expect(() => buildScenarioSteps(["user", "y"], edges)).toThrow('"user" e "y"'));
});

describe("shortestNodePath", () => {
  it("retorna null sem conexão", () => expect(shortestNodePath("user", "x", edges)).toBeNull());
});

describe("stepEndpoints", () => {
  it("inverte origem e destino no passo de volta", () =>
    expect(stepEndpoints({ edgeId: "e3", reverse: true }, edges)).toEqual({ from: "db", to: "api" }));
});
