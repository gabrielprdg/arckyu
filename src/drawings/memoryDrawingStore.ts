import type { DrawingCollection, DrawingContent, DrawingMeta, DrawingStore } from "./drawingTypes";

/**
 * Desenhos só na memória da aba: usado nos testes e como plano B quando o navegador bloqueia o IndexedDB.
 * @example const store = new MemoryDrawingStore(); await store.saveDrawing(meta, content);
 */
export class MemoryDrawingStore implements DrawingStore {
  private readonly drawings = new Map<string, DrawingMeta>();
  private readonly contents = new Map<string, DrawingContent>();
  private readonly collections = new Map<string, DrawingCollection>();

  async listDrawings(): Promise<DrawingMeta[]> {
    return [...this.drawings.values()];
  }

  async listCollections(): Promise<DrawingCollection[]> {
    return [...this.collections.values()];
  }

  async getContent(id: string): Promise<DrawingContent | null> {
    return this.contents.get(id) ?? null;
  }

  async saveDrawing(meta: DrawingMeta, content?: DrawingContent): Promise<void> {
    this.drawings.set(meta.id, meta);
    if (content) this.contents.set(content.id, content);
  }

  async deleteDrawing(id: string): Promise<void> {
    this.drawings.delete(id);
    this.contents.delete(id);
  }

  async saveCollection(collection: DrawingCollection): Promise<void> {
    this.collections.set(collection.id, collection);
  }

  async deleteCollection(id: string): Promise<void> {
    this.collections.delete(id);
  }
}
