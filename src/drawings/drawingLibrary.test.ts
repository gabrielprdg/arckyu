import { describe, expect, it } from "vitest";
import { EMPTY_BOOK } from "../app/scenarioBook";
import { bootLibrary, copyName, createCollection, createDrawing, duplicateDrawing, editedAgo, filterDrawings, removeCollection, type LibraryDeps, type NewDrawing } from "./drawingLibrary";
import type { DrawingMeta } from "./drawingTypes";
import { MemoryDrawingStore } from "./memoryDrawingStore";

const depsWith = (store = new MemoryDrawingStore()): LibraryDeps => {
  let clock = 1_000;
  let seq = 0;
  return { store, now: () => (clock += 1_000), newId: () => `id-${++seq}` };
};

const drawing = (name: string, patch: Partial<NewDrawing> = {}): NewDrawing => ({ name, scene: `{"elements":[],"name":"${name}"}`, book: EMPTY_BOOK, ...patch });
const meta = (name: string, updatedAt: number, collectionId: string | null = null): DrawingMeta =>
  ({ id: name, name, collectionId, createdAt: 0, updatedAt, thumbnail: null });

describe("copyName", () => {
  it("primeira cópia", () => expect(copyName("Pagamentos", [])).toBe("Pagamentos (cópia)"));
  it("não repete nome existente", () => expect(copyName("Pagamentos", ["Pagamentos (cópia)"])).toBe("Pagamentos (cópia 2)"));
});

describe("filterDrawings", () => {
  const list = [meta("Loja C4", 1, "c1"), meta("Pagamentos", 3), meta("Notificação", 2, "c1")];
  it("busca sem acento e sem caixa, mais recentes primeiro", () =>
    expect(filterDrawings(list, { query: "NOTIFICACAO", collection: "all" }).map((d) => d.name)).toEqual(["Notificação"]));
  it("filtra pela coleção", () => expect(filterDrawings(list, { query: "", collection: "c1" }).map((d) => d.name)).toEqual(["Notificação", "Loja C4"]));
  it("sem coleção", () => expect(filterDrawings(list, { query: "", collection: "none" }).map((d) => d.name)).toEqual(["Pagamentos"]));
});

describe("editedAgo", () => {
  it("menos de um minuto é agora", () => expect(editedAgo(10_000, 30_000)).toBe("agora"));
  it("minutos", () => expect(editedAgo(0, 120_000)).toBe("há 2 minutos"));
  it("um dia atrás vira ontem", () => expect(editedAgo(0, 86_400_000)).toBe("ontem"));
});

describe("createDrawing / duplicateDrawing", () => {
  it("grava metadados e conteúdo juntos", async () => {
    const deps = depsWith();
    const created = await createDrawing(deps, drawing("  "));
    expect([created.name, (await deps.store.getContent(created.id))?.scene]).toEqual(["Sem título", '{"elements":[],"name":"  "}']);
  });
  it("cópia leva conteúdo e coleção, com nome novo", async () => {
    const deps = depsWith();
    const original = await createDrawing(deps, drawing("Fluxo", { collectionId: "c1" }));
    const copy = await duplicateDrawing(deps, original, ["Fluxo"]);
    expect([copy.name, copy.collectionId, (await deps.store.getContent(copy.id))?.scene]).toEqual(["Fluxo (cópia)", "c1", '{"elements":[],"name":"Fluxo"}']);
  });
  it("explica quando o original não tem conteúdo", async () =>
    expect(duplicateDrawing(depsWith(), meta("Perdido", 1), [])).rejects.toThrow('"Perdido"'));
});

describe("removeCollection", () => {
  it("desenhos da coleção ficam sem coleção", async () => {
    const deps = depsWith();
    const collection = await createCollection(deps, "Clientes");
    const inside = await createDrawing(deps, drawing("A", { collectionId: collection.id }));
    const moved = await removeCollection(deps, collection.id, [inside]);
    expect([moved[0].collectionId, (await deps.store.listCollections()).length]).toEqual([null, 0]);
  });
});

describe("bootLibrary", () => {
  const example = async () => drawing("Exemplo");
  it("biblioteca vazia migra o desenho antigo", async () => {
    const result = await bootLibrary(depsWith(), { legacy: drawing("Meu desenho"), linked: null, example, lastOpenedId: null });
    expect(result.drawings.map((d) => d.name)).toEqual(["Meu desenho"]);
  });
  it("sem nada salvo abre o exemplo", async () => {
    const result = await bootLibrary(depsWith(), { legacy: null, linked: null, example, lastOpenedId: null });
    expect(result.drawings.map((d) => d.name)).toEqual(["Exemplo"]);
  });
  it("link de modelo cria desenho novo e abre ele", async () => {
    const deps = depsWith();
    await createDrawing(deps, drawing("Antigo"));
    const result = await bootLibrary(deps, { legacy: null, linked: async () => drawing("Loja Nimbus"), example, lastOpenedId: null });
    expect([result.drawings.length, result.drawings.find((d) => d.id === result.openId)?.name]).toEqual([2, "Loja Nimbus"]);
  });
  it("reabre o último desenho aberto", async () => {
    const deps = depsWith();
    const first = await createDrawing(deps, drawing("Primeiro"));
    await createDrawing(deps, drawing("Segundo"));
    expect((await bootLibrary(deps, { legacy: null, linked: null, example, lastOpenedId: first.id })).openId).toBe(first.id);
  });
});
