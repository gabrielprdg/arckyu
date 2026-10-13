import type { ScenarioBook } from "../app/scenarioBook";

/** Dados leves de um desenho (lista, busca, miniatura); o conteúdo fica separado para a lista abrir rápido. */
export type DrawingMeta = {
  id: string;
  name: string;
  collectionId: string | null;
  createdAt: number;
  updatedAt: number;
  /** data URL pequena (webp) gerada do próprio desenho; null até o primeiro salvamento. */
  thumbnail: string | null;
};

/** Conteúdo de um desenho: cena no formato .excalidraw (string) + cenários do play. Vira um JSONB no Supabase. */
export type DrawingContent = { id: string; scene: string; book: ScenarioBook };

export type DrawingCollection = { id: string; name: string; createdAt: number };

/** Onde os desenhos moram (IndexedDB hoje, Supabase depois); a interface é a mesma para os dois. */
export interface DrawingStore {
  listDrawings(): Promise<DrawingMeta[]>;
  listCollections(): Promise<DrawingCollection[]>;
  getContent(id: string): Promise<DrawingContent | null>;
  /** Grava os metadados e, se vier, o conteúdo (metadados primeiro: o conteúdo depende deles). */
  saveDrawing(meta: DrawingMeta, content?: DrawingContent): Promise<void>;
  deleteDrawing(id: string): Promise<void>;
  saveCollection(collection: DrawingCollection): Promise<void>;
  deleteCollection(id: string): Promise<void>;
}

/** Armazenamento em uso; `persistent` = false quando os desenhos só vivem nesta aba (plano B sem banco). */
export type StoreHandle = { store: DrawingStore; persistent: boolean };
