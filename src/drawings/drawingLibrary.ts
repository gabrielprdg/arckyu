import type { ScenarioBook } from "../app/scenarioBook";
import type { DrawingCollection, DrawingMeta, DrawingStore } from "./drawingTypes";

/** Dependências injetadas: onde salvar, relógio e gerador de id (determinísticos nos testes). */
export type LibraryDeps = { store: DrawingStore; now: () => number; newId: () => string };

/** Desenho a criar: cena no formato .excalidraw + cenários. */
export type NewDrawing = { name: string; scene: string; book: ScenarioBook; collectionId?: string | null };

/** "all" = todos, "none" = sem coleção, ou o id de uma coleção. */
export type CollectionFilter = "all" | "none" | string;

const MAX_NAME = 120;

/**
 * Nome limpo; vazio cai no padrão.
 * @example cleanName("  ", "Sem título") // "Sem título"
 */
export const cleanName = (name: string, fallback: string): string => name.trim().slice(0, MAX_NAME) || fallback;

/**
 * Nome da cópia sem repetir os que já existem.
 * @example copyName("Pagamentos", ["Pagamentos (cópia)"]) // "Pagamentos (cópia 2)"
 */
export const copyName = (name: string, taken: readonly string[]): string => {
  const used = new Set(taken);
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? `${name} (cópia)` : `${name} (cópia ${n})`;
    if (!used.has(candidate)) return candidate;
  }
};

const searchable = (text: string): string => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const inCollection = (drawing: DrawingMeta, filter: CollectionFilter): boolean =>
  filter === "all" || (filter === "none" ? drawing.collectionId === null : drawing.collectionId === filter);

/**
 * Desenhos da coleção escolhida cujo nome bate com a busca (sem acento/caixa), mais recentes primeiro.
 * @example filterDrawings(drawings, { query: "duplic", collection: "all" })
 */
export const filterDrawings = (drawings: readonly DrawingMeta[], filter: { query: string; collection: CollectionFilter }): DrawingMeta[] => {
  const query = searchable(filter.query.trim());
  return drawings
    .filter((drawing) => inCollection(drawing, filter.collection) && searchable(drawing.name).includes(query))
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

/** Mais recente primeiro; null se a lista estiver vazia. */
export const mostRecent = (drawings: readonly DrawingMeta[]): DrawingMeta | null =>
  drawings.reduce<DrawingMeta | null>((best, drawing) => (!best || drawing.updatedAt > best.updatedAt ? drawing : best), null);

const RELATIVE = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [["day", 86_400_000], ["hour", 3_600_000], ["minute", 60_000]];

/**
 * "agora", "há 5 minutos", "ontem"…
 * @example editedAgo(now - 120_000, now) // "há 2 minutos"
 */
export const editedAgo = (updatedAt: number, now: number): string => {
  const elapsed = Math.max(0, now - updatedAt);
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) return RELATIVE.format(-Math.floor(elapsed / size), unit);
  }
  return "agora";
};

/** Cria e grava um desenho novo. @example await createDrawing(deps, { name: "Novo", scene, book: EMPTY_BOOK }) */
export const createDrawing = async (deps: LibraryDeps, input: NewDrawing, thumbnail: string | null = null): Promise<DrawingMeta> => {
  const id = deps.newId();
  const time = deps.now();
  const meta: DrawingMeta = { id, name: cleanName(input.name, "Sem título"), collectionId: input.collectionId ?? null, createdAt: time, updatedAt: time, thumbnail };
  await deps.store.saveDrawing(meta, { id, scene: input.scene, book: input.book });
  return meta;
};

/** Cópia com conteúdo, coleção e miniatura do original. */
export const duplicateDrawing = async (deps: LibraryDeps, source: DrawingMeta, taken: readonly string[]): Promise<DrawingMeta> => {
  const content = await deps.store.getContent(source.id);
  if (!content) throw new Error(`desenho "${source.name}" (${source.id}) não tem conteúdo salvo para duplicar`);
  const input: NewDrawing = { name: copyName(source.name, taken), scene: content.scene, book: content.book, collectionId: source.collectionId };
  return createDrawing(deps, input, source.thumbnail);
};

/** Apaga a coleção; os desenhos dela ficam "sem coleção" (nada é perdido). Devolve os desenhos alterados. */
export const removeCollection = async (deps: LibraryDeps, collectionId: string, drawings: readonly DrawingMeta[]): Promise<DrawingMeta[]> => {
  const unfiled = drawings.filter((drawing) => drawing.collectionId === collectionId).map((drawing) => ({ ...drawing, collectionId: null }));
  await Promise.all(unfiled.map((drawing) => deps.store.saveDrawing(drawing)));
  await deps.store.deleteCollection(collectionId);
  return unfiled;
};

export const createCollection = async (deps: LibraryDeps, name: string): Promise<DrawingCollection> => {
  const collection: DrawingCollection = { id: deps.newId(), name: cleanName(name, "Nova coleção"), createdAt: deps.now() };
  await deps.store.saveCollection(collection);
  return collection;
};

/** De onde vem o primeiro desenho: o que já estava salvo (versão antiga), um link de modelo ou o exemplo. */
export type BootSources = {
  legacy: NewDrawing | null;
  linked: (() => Promise<NewDrawing>) | null;
  example: () => Promise<NewDrawing>;
  lastOpenedId: string | null;
};

export type BootResult = { drawings: DrawingMeta[]; collections: DrawingCollection[]; openId: string };

const firstDrawings = async (deps: LibraryDeps, sources: BootSources): Promise<DrawingMeta[]> => {
  const first = sources.legacy ?? (sources.linked ? null : await sources.example());
  return first ? [await createDrawing(deps, first)] : [];
};

/**
 * Carga inicial: biblioteca vazia ganha o desenho antigo (migração) ou o exemplo; link de modelo vira desenho novo.
 * @example const { drawings, openId } = await bootLibrary(deps, { legacy: null, linked: null, example, lastOpenedId: null });
 */
export const bootLibrary = async (deps: LibraryDeps, sources: BootSources): Promise<BootResult> => {
  const [stored, collections] = await Promise.all([deps.store.listDrawings(), deps.store.listCollections()]);
  let drawings = stored.length > 0 ? stored : await firstDrawings(deps, sources);
  let openId = drawings.find((drawing) => drawing.id === sources.lastOpenedId)?.id ?? mostRecent(drawings)?.id ?? null;
  if (sources.linked) {
    const linked = await createDrawing(deps, await sources.linked());
    drawings = [...drawings, linked];
    openId = linked.id;
  }
  if (!openId) throw new Error("biblioteca sem desenho para abrir depois da carga inicial");
  return { drawings, collections, openId };
};
