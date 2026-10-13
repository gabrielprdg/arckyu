import { describe, expect, it } from "vitest";
import { LazyDrawingStore } from "./lazyDrawingStore";
import { MemoryDrawingStore } from "./memoryDrawingStore";

const meta = { id: "d1", name: "Fluxo", collectionId: null, createdAt: 1, updatedAt: 2, thumbnail: null };

describe("LazyDrawingStore", () => {
  it("só abre o armazenamento no primeiro uso, e uma vez", async () => {
    let opens = 0;
    const inner = new MemoryDrawingStore();
    const store = new LazyDrawingStore(async () => { opens++; return inner; });
    expect(opens).toBe(0);
    await store.saveDrawing(meta, { id: "d1", scene: "{}", book: { scenarios: [], active: 0 } });
    expect([opens, (await store.listDrawings()).length, (await store.getContent("d1"))?.scene]).toEqual([1, 1, "{}"]);
  });
});
