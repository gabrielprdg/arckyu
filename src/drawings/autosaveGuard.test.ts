import { describe, expect, it } from "vitest";
import { belongsToOpenDrawing } from "./autosaveGuard";

describe("belongsToOpenDrawing", () => {
  it("aceita aviso do desenho aberto", () => expect(belongsToOpenDrawing({ id: "nimbus" }, "nimbus")).toBe(true));
  it("recusa aviso do desenho recém-aberto antes do autosave trocar de alvo (cenários iam para o desenho anterior)", () =>
    expect(belongsToOpenDrawing({ id: "nimbus" }, "serverless")).toBe(false));
  it("sem desenho acompanhado, recusa tudo", () => expect(belongsToOpenDrawing(null, "nimbus")).toBe(false));
});
