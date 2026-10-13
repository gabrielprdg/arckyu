import type { DrawingCollection, DrawingContent, DrawingMeta, DrawingStore } from "./drawingTypes";

/**
 * Abre o armazenamento só no primeiro uso (o IndexedDB abre de forma assíncrona e o app precisa do objeto já no boot).
 * @example const store = new LazyDrawingStore(() => IndexedDbDrawingStore.open());
 */
export class LazyDrawingStore implements DrawingStore {
  private opened: Promise<DrawingStore> | null = null;

  constructor(private readonly open: () => Promise<DrawingStore>) {}

  private store(): Promise<DrawingStore> {
    this.opened ??= this.open();
    return this.opened;
  }

  async listDrawings(): Promise<DrawingMeta[]> { return (await this.store()).listDrawings(); }
  async listCollections(): Promise<DrawingCollection[]> { return (await this.store()).listCollections(); }
  async getContent(id: string): Promise<DrawingContent | null> { return (await this.store()).getContent(id); }
  async saveDrawing(meta: DrawingMeta, content?: DrawingContent): Promise<void> { return (await this.store()).saveDrawing(meta, content); }
  async deleteDrawing(id: string): Promise<void> { return (await this.store()).deleteDrawing(id); }
  async saveCollection(collection: DrawingCollection): Promise<void> { return (await this.store()).saveCollection(collection); }
  async deleteCollection(id: string): Promise<void> { return (await this.store()).deleteCollection(id); }
}
