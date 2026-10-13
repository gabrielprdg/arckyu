import { describe, expect, it } from "vitest";
import { customIconRef } from "./customIconStore";

describe("customIconRef", () => {
  it("gera ref legível sem acento", () => expect(customIconRef("Função KEDA ScaledJob", "x1")).toBe("custom:funcao-keda-scaledjob-x1"));
  it("não fica vazio com nome só de símbolos", () => expect(customIconRef("!!!", "x1")).toBe("custom:item-x1"));
});
