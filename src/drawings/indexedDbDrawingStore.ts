import type { DrawingCollection, DrawingContent, DrawingMeta, DrawingStore } from "./drawingTypes";

const DB_NAME = "arckyu";
const DB_VERSION = 1;
const DRAWINGS = "drawings";
const CONTENTS = "contents";
const COLLECTIONS = "collections";

const settle = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`IndexedDB falhou em ${String(request.source)}`));
  });

const finished = (tx: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("transação do IndexedDB falhou"));
    tx.onabort = () => reject(tx.error ?? new Error("transação do IndexedDB abortada (cota cheia?)"));
  });

const openDatabase = (name: string): Promise<IDBDatabase> => {
  const request = indexedDB.open(name, DB_VERSION);
  request.onupgradeneeded = () => {
    for (const store of [DRAWINGS, CONTENTS, COLLECTIONS]) {
      if (!request.result.objectStoreNames.contains(store)) request.result.createObjectStore(store, { keyPath: "id" });
    }
  };
  return settle(request);
};

/**
 * Desenhos no IndexedDB do navegador (aguenta cenas grandes com imagens, ao contrário do localStorage).
 * @example const store = await IndexedDbDrawingStore.open(); await store.listDrawings();
 */
export class IndexedDbDrawingStore implements DrawingStore {
  private constructor(private readonly db: IDBDatabase) {}

  static async open(name = DB_NAME): Promise<IndexedDbDrawingStore> {
    return new IndexedDbDrawingStore(await openDatabase(name));
  }

  private readAll<T>(storeName: string): Promise<T[]> {
    return settle(this.db.transaction(storeName, "readonly").objectStore(storeName).getAll());
  }

  listDrawings(): Promise<DrawingMeta[]> {
    return this.readAll<DrawingMeta>(DRAWINGS);
  }

  listCollections(): Promise<DrawingCollection[]> {
    return this.readAll<DrawingCollection>(COLLECTIONS);
  }

  async getContent(id: string): Promise<DrawingContent | null> {
    const found: DrawingContent | undefined = await settle(this.db.transaction(CONTENTS, "readonly").objectStore(CONTENTS).get(id));
    return found ?? null;
  }

  saveDrawing(meta: DrawingMeta, content?: DrawingContent): Promise<void> {
    const tx = this.db.transaction([DRAWINGS, CONTENTS], "readwrite");
    tx.objectStore(DRAWINGS).put(meta);
    if (content) tx.objectStore(CONTENTS).put(content);
    return finished(tx);
  }

  deleteDrawing(id: string): Promise<void> {
    const tx = this.db.transaction([DRAWINGS, CONTENTS], "readwrite");
    tx.objectStore(DRAWINGS).delete(id);
    tx.objectStore(CONTENTS).delete(id);
    return finished(tx);
  }

  saveCollection(collection: DrawingCollection): Promise<void> {
    const tx = this.db.transaction(COLLECTIONS, "readwrite");
    tx.objectStore(COLLECTIONS).put(collection);
    return finished(tx);
  }

  deleteCollection(id: string): Promise<void> {
    const tx = this.db.transaction(COLLECTIONS, "readwrite");
    tx.objectStore(COLLECTIONS).delete(id);
    return finished(tx);
  }
}
