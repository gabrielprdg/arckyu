import type { ScenarioBook } from "../app/scenarioBook";
import type { DrawingCollection, DrawingContent, DrawingMeta } from "./drawingTypes";

/** Linhas como o Postgres devolve (datas em ISO). owner_id não aparece: o banco preenche com auth.uid(). */
export type DrawingRow = { id: string; name: string; collection_id: string | null; created_at: string; updated_at: string; thumbnail: string | null };
export type CollectionRow = { id: string; name: string; created_at: string };
export type ContentRow = { drawing_id: string; scene: unknown; book: unknown };

const toMs = (iso: string): number => {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) throw new Error(`data inválida vinda do banco: "${iso}" (esperado ISO 8601)`);
  return ms;
};
const toIso = (ms: number): string => new Date(ms).toISOString();

/** @example rowToMeta({ id, name, collection_id: null, created_at: "2026-10-12T10:00:00Z", … }).createdAt // 1791800400000 */
export const rowToMeta = (row: DrawingRow): DrawingMeta => ({
  id: row.id, name: row.name, collectionId: row.collection_id, createdAt: toMs(row.created_at), updatedAt: toMs(row.updated_at), thumbnail: row.thumbnail,
});

export const metaToRow = (meta: DrawingMeta): DrawingRow => ({
  id: meta.id, name: meta.name, collection_id: meta.collectionId, created_at: toIso(meta.createdAt), updated_at: toIso(meta.updatedAt), thumbnail: meta.thumbnail,
});

export const rowToCollection = (row: CollectionRow): DrawingCollection => ({ id: row.id, name: row.name, createdAt: toMs(row.created_at) });
export const collectionToRow = (collection: DrawingCollection): CollectionRow => ({ id: collection.id, name: collection.name, created_at: toIso(collection.createdAt) });

const isBook = (value: unknown): value is ScenarioBook =>
  typeof value === "object" && value !== null && "scenarios" in value && Array.isArray(value.scenarios) && "active" in value && typeof value.active === "number";

// No banco a cena é jsonb (dá para consultar depois); no app ela circula como texto .excalidraw.
export const contentToRow = (content: DrawingContent): ContentRow => ({ drawing_id: content.id, scene: JSON.parse(content.scene), book: content.book });

/** @example rowToContent({ drawing_id: "d1", scene: { elements: [] }, book: { scenarios: [], active: 0 } }).scene // '{"elements":[]}' */
export const rowToContent = (row: ContentRow): DrawingContent => {
  if (!isBook(row.book)) throw new Error(`cenários do desenho ${row.drawing_id} em formato inesperado: ${JSON.stringify(row.book).slice(0, 80)}`);
  return { id: row.drawing_id, scene: JSON.stringify(row.scene), book: row.book };
};
