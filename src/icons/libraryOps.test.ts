import { describe, expect, it } from "vitest";
import type { IconDefinition } from "./catalog";
import { applyOverrides, iconFileKey, isCustomRef, removeByRef, upsertByRef, withoutKey } from "./libraryOps";

const icon = (ref: string, name = ref): IconDefinition => ({ ref, name, category: "client", aliases: [], source: { kind: "lucide" } });

describe("libraryOps", () => {
  it("aplica personalização sem mudar a ordem do catálogo", () =>
    expect(applyOverrides([icon("a"), icon("b")], { b: icon("b", "B novo") }).map((i) => i.name)).toEqual(["a", "B novo"]));
  it("upsert substitui pelo ref ou acrescenta", () => {
    expect(upsertByRef([icon("a")], icon("a", "A2")).map((i) => i.name)).toEqual(["A2"]);
    expect(upsertByRef([icon("a")], icon("b")).map((i) => i.ref)).toEqual(["a", "b"]);
  });
  it("remove pelo ref", () => expect(removeByRef([icon("a"), icon("b")], "a").map((i) => i.ref)).toEqual(["b"]));
  it("withoutKey tira só a chave pedida", () => expect(withoutKey({ a: 1, b: 2 }, "a")).toEqual({ b: 2 }));
  it("reconhece item do usuário", () => expect([isCustomRef("custom:b3-x1"), isCustomRef("tech:sap")]).toEqual([true, false]));
  it("chave do arquivo muda quando o ícone muda", () => {
    const a = iconFileKey({ ref: "tech:sap", source: { kind: "iconify", id: "logos:sap" } });
    const b = iconFileKey({ ref: "tech:sap", source: { kind: "iconify", id: "simple-icons:sap" } });
    expect(a).not.toBe(b);
    expect(a).toBe(iconFileKey({ ref: "tech:sap", source: { kind: "iconify", id: "logos:sap" } }));
  });
});
