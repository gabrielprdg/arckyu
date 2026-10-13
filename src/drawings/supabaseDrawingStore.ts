import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { DrawingCollection, DrawingContent, DrawingMeta, DrawingStore } from "./drawingTypes";
import { collectionToRow, contentToRow, metaToRow, rowToCollection, rowToContent, rowToMeta, type CollectionRow, type ContentRow, type DrawingRow } from "./supabaseRows";

const DRAWING_COLUMNS = "id, name, collection_id, created_at, updated_at, thumbnail";

const fail = (action: string, error: PostgrestError): never => {
  throw new Error(`Supabase: ${action} falhou (${error.code}): ${error.message}`);
};

/**
 * Desenhos na conta do usuário (tabelas drawings/drawing_contents/collections, protegidas por RLS).
 * @example const store = new SupabaseDrawingStore(client); await store.listDrawings();
 */
export class SupabaseDrawingStore implements DrawingStore {
  constructor(private readonly client: SupabaseClient) {}

  async listDrawings(): Promise<DrawingMeta[]> {
    const { data, error } = await this.client.from("drawings").select(DRAWING_COLUMNS).returns<DrawingRow[]>();
    if (error) return fail("listar desenhos", error);
    return (data ?? []).map(rowToMeta);
  }

  async listCollections(): Promise<DrawingCollection[]> {
    const { data, error } = await this.client.from("collections").select("id, name, created_at").returns<CollectionRow[]>();
    if (error) return fail("listar coleções", error);
    return (data ?? []).map(rowToCollection);
  }

  async getContent(id: string): Promise<DrawingContent | null> {
    const { data, error } = await this.client.from("drawing_contents").select("drawing_id, scene, book").eq("drawing_id", id).maybeSingle<ContentRow>();
    if (error) return fail(`abrir o desenho ${id}`, error);
    return data ? rowToContent(data) : null;
  }

  // Metadados antes do conteúdo: o conteúdo referencia o desenho (FK + policy).
  async saveDrawing(meta: DrawingMeta, content?: DrawingContent): Promise<void> {
    const saved = await this.client.from("drawings").upsert(metaToRow(meta));
    if (saved.error) fail(`salvar "${meta.name}"`, saved.error);
    if (!content) return;
    const stored = await this.client.from("drawing_contents").upsert(contentToRow(content));
    if (stored.error) fail(`salvar o conteúdo de "${meta.name}"`, stored.error);
  }

  async deleteDrawing(id: string): Promise<void> {
    const { error } = await this.client.from("drawings").delete().eq("id", id);
    if (error) fail(`apagar o desenho ${id}`, error);
  }

  async saveCollection(collection: DrawingCollection): Promise<void> {
    const { error } = await this.client.from("collections").upsert(collectionToRow(collection));
    if (error) fail(`salvar a coleção "${collection.name}"`, error);
  }

  async deleteCollection(id: string): Promise<void> {
    const { error } = await this.client.from("collections").delete().eq("id", id);
    if (error) fail(`apagar a coleção ${id}`, error);
  }
}
