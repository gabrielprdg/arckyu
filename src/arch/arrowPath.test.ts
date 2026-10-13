import { describe, expect, it } from "vitest";
import { arrowPathD } from "./arrowPath";

describe("arrowPathD", () => {
  it("desloca os pontos locais pela posição da seta", () =>
    expect(arrowPathD({ x: 10, y: 10, points: [[0, 0], [100, 0]], roundness: null })).toBe("M10 10 L110 10"));
  it("usa polilinha em seta elbow", () =>
    expect(arrowPathD({ x: 0, y: 0, points: [[0, 0], [50, 0], [50, 50]], roundness: { type: 2 }, elbowed: true })).toBe("M0 0 L50 0 L50 50"));
  it("usa curva em seta arredondada com mais de 2 pontos", () =>
    expect(arrowPathD({ x: 0, y: 0, points: [[0, 0], [50, 20], [100, 0]], roundness: { type: 2 } })).toMatch(/^M0 0 C/));
  it("devolve vazio sem pontos suficientes", () => expect(arrowPathD({ x: 0, y: 0, points: [[0, 0]], roundness: null })).toBe(""));
});
