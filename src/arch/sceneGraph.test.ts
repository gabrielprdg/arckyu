import { describe, expect, it } from "vitest";
import { buildSceneGraph, type SceneElementLike } from "./sceneGraph";

const base = { isDeleted: false, x: 0, y: 0, width: 80, height: 80, strokeColor: "#e03131", strokeWidth: 2, strokeStyle: "solid", roundness: null };
const card = (id: string, group: string): SceneElementLike => ({
  ...base, id, type: "rectangle", groupIds: [group],
  customData: { archflow: { kind: "card", iconRef: "generic:server", technology: "", owner: "", description: "" } },
});
const icon = (id: string, group: string): SceneElementLike => ({ ...base, id, type: "image", groupIds: [group] });
const arrow = (id: string, from: string | null, to: string | null, patch: Partial<SceneElementLike> = {}): SceneElementLike => ({
  ...base, id, type: "arrow", groupIds: [], points: [[0, 0], [100, 0]],
  startBinding: from ? { elementId: from } : null, endBinding: to ? { elementId: to } : null, ...patch,
});

const scene = [card("a", "ga"), icon("a-icon", "ga"), card("b", "gb"), arrow("e1", "a", "b"), arrow("e2", "a-icon", "b", { strokeStyle: "dashed" }), arrow("loose", "a", null)];

describe("buildSceneGraph", () => {
  it("reconhece cards pelo customData", () => expect([...buildSceneGraph(scene).cards.keys()]).toEqual(["a", "b"]));
  it("seta ligando dois cards já nasce com bolinhas (sem tracejado em movimento)", () =>
    expect(buildSceneGraph(scene).flows.find((f) => f.id === "e1")).toMatchObject({ edge: { source: "a", target: "b" }, flow: { packets: true, animated: false, color: "#e03131" } }));
  it("comunicação guardada no customData vence o estilo do traço", () => {
    const solidAsync = arrow("e3", "a", "b", { customData: { archflow: { kind: "flow", communication: "async", flow: { animated: false, direction: "forward", speed: 40, packets: true } } } });
    expect(buildSceneGraph([...scene, solidAsync]).flows.find((f) => f.id === "e3")?.communication).toBe("async");
  });
  it("seta grudada no ícone do card conta como o card", () =>
    expect(buildSceneGraph(scene).edges.find((e) => e.id === "e2")?.source).toBe("a"));
  it("tracejado vira comunicação assíncrona", () =>
    expect(buildSceneGraph(scene).flows.find((f) => f.id === "e2")?.communication).toBe("async"));
  it("seta solta, sem customData, não anima", () => expect(buildSceneGraph(scene).flows.some((f) => f.id === "loose")).toBe(false));
  it("ignora elementos apagados", () => expect(buildSceneGraph([{ ...card("x", "gx"), isDeleted: true }]).cards.size).toBe(0));
});

describe("groupBounds", () => {
  it("área do card inclui nome e legenda do grupo", () => {
    const label: SceneElementLike = { ...base, id: "a-label", type: "text", groupIds: ["ga"], x: -20, y: 90, width: 120, height: 30 };
    expect(buildSceneGraph([card("a", "ga"), label]).cards.get("a")?.groupBounds).toEqual({ x: -20, y: 0, width: 120, height: 120 });
  });
});
