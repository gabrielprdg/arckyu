import { describe, expect, it } from "vitest";
import { contentToRow, metaToRow, rowToContent, rowToMeta } from "./supabaseRows";

const meta = { id: "d1", name: "Fluxo", collectionId: null, createdAt: Date.parse("2026-10-12T10:00:00.000Z"), updatedAt: Date.parse("2026-10-12T11:30:00.000Z"), thumbnail: null };

describe("linhas do Supabase", () => {
  it("metadados vão e voltam sem perder nada", () => expect(rowToMeta(metaToRow(meta))).toEqual(meta));
  it("datas viram ISO no banco", () => expect(metaToRow(meta).updated_at).toBe("2026-10-12T11:30:00.000Z"));
  it("data inválida explica o valor", () => expect(() => rowToMeta({ ...metaToRow(meta), created_at: "ontem" })).toThrow('"ontem"'));
  it("cena vira jsonb e volta como texto", () => {
    const content = { id: "d1", scene: '{"type":"excalidraw","elements":[]}', book: { scenarios: [], active: 0 } };
    expect(rowToContent(contentToRow(content))).toEqual(content);
  });
  it("recusa cenários em formato estranho", () => expect(() => rowToContent({ drawing_id: "d1", scene: {}, book: [] })).toThrow("d1"));
});
