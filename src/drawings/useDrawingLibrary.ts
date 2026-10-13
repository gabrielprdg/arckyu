import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScenarioBook } from "../app/scenarioBook";
import type { DiagramTemplate } from "../arch/diagramTemplate";
import { DEFAULT_TEMPLATE, findTemplate } from "../arch/templates";
import { bootLibrary, cleanName, createCollection, createDrawing, duplicateDrawing, mostRecent, removeCollection, type LibraryDeps, type NewDrawing } from "./drawingLibrary";
import type { DrawingCollection, DrawingMeta, StoreHandle } from "./drawingTypes";
import { lastOpenedDrawing, legacyDrawing, markLegacyMigrated, rememberOpenedDrawing } from "./libraryPrefs";
import { blankDrawing, decodeScene, templateDrawing } from "./sceneCodec";

/** Desenho aberto no editor. `sceneText`/`book` são o ponto de partida do autosave. */
export type OpenDrawing = { id: string; initialData: ExcalidrawInitialDataState; sceneText: string; book: ScenarioBook; needsThumbnail: boolean };

const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));
const replaceById = <T extends { id: string }>(list: readonly T[], item: T): T[] =>
  list.some((entry) => entry.id === item.id) ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];

const useLibraryState = () => {
  const [drawings, setDrawings] = useState<DrawingMeta[]>([]);
  const [collections, setCollections] = useState<DrawingCollection[]>([]);
  const [current, setCurrent] = useState<OpenDrawing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const drawingsRef = useRef(drawings);
  drawingsRef.current = drawings;
  return { drawings, setDrawings, collections, setCollections, current, setCurrent, error, setError, drawingsRef };
};

type LibraryState = ReturnType<typeof useLibraryState>;

// Toda ação reporta a falha na tela em vez de sumir: "apagar não fez nada" é pior que uma mensagem.
const useReporter = (state: LibraryState) =>
  useCallback(<A extends unknown[]>(action: (...args: A) => Promise<void>) => async (...args: A): Promise<void> => {
    try {
      state.setError(null);
      await action(...args);
    } catch (error) {
      state.setError(messageOf(error));
    }
  }, [state.setError]);

const useOpen = (deps: LibraryDeps | null, state: LibraryState) =>
  useCallback(async (id: string): Promise<void> => {
    if (!deps) return;
    const content = await deps.store.getContent(id);
    if (!content) throw new Error(`desenho ${id} não tem conteúdo salvo`);
    const needsThumbnail = !state.drawingsRef.current.find((drawing) => drawing.id === id)?.thumbnail;
    state.setCurrent({ id, initialData: decodeScene(content.scene), sceneText: content.scene, book: content.book, needsThumbnail });
    rememberOpenedDrawing(id);
  }, [deps, state.setCurrent]);

type BootInput = { handle: StoreHandle | null; deps: LibraryDeps | null; linked: DiagramTemplate | null };

const useBoot = ({ handle, deps, linked }: BootInput, state: LibraryState, open: (id: string) => Promise<void>) => {
  useEffect(() => {
    if (!handle || !deps) return;
    bootLibrary(deps, {
      legacy: legacyDrawing(),
      linked: linked ? () => templateDrawing(linked) : null,
      example: () => templateDrawing(DEFAULT_TEMPLATE),
      lastOpenedId: lastOpenedDrawing(),
    }).then(async (result) => {
      if (handle.persistent) markLegacyMigrated();
      state.setDrawings(result.drawings);
      state.setCollections(result.collections);
      await open(result.openId);
    }).catch((error: unknown) => state.setError(`não consegui abrir seus desenhos: ${messageOf(error)}`));
  }, [handle, deps]);
};

const useDrawingActions = (deps: LibraryDeps | null, state: LibraryState, open: (id: string) => Promise<void>) => {
  const createAndOpen = useCallback(async (input: NewDrawing) => {
    if (!deps) return;
    const created = await createDrawing(deps, input);
    state.setDrawings((list) => [...list, created]);
    await open(created.id);
  }, [deps, open]);

  const patch = useCallback(async (id: string, change: Partial<DrawingMeta>) => {
    const found = state.drawingsRef.current.find((drawing) => drawing.id === id);
    if (!deps || !found) return;
    const next = { ...found, ...change };
    await deps.store.saveDrawing(next);
    state.setDrawings((list) => replaceById(list, next));
  }, [deps]);

  const remove = useCallback(async (id: string) => {
    if (!deps) return;
    await deps.store.deleteDrawing(id);
    const rest = state.drawingsRef.current.filter((drawing) => drawing.id !== id);
    state.setDrawings(rest);
    if (state.current?.id !== id) return;
    const next = mostRecent(rest);
    await (next ? open(next.id) : createAndOpen(blankDrawing("Sem título")));
  }, [deps, open, createAndOpen, state.current?.id]);

  const duplicate = useCallback(async (id: string, flushCurrent: () => Promise<void>) => {
    const source = state.drawingsRef.current.find((drawing) => drawing.id === id);
    if (!deps || !source) return;
    await flushCurrent();
    const copy = await duplicateDrawing(deps, source, state.drawingsRef.current.map((drawing) => drawing.name));
    state.setDrawings((list) => [...list, copy]);
  }, [deps]);

  return { createAndOpen, patch, remove, duplicate };
};

const useCollectionActions = (deps: LibraryDeps | null, state: LibraryState) => {
  const add = useCallback(async (name: string) => {
    if (!deps) return;
    const created = await createCollection(deps, name);
    state.setCollections((list) => [...list, created]);
  }, [deps]);

  const rename = useCallback(async (collection: DrawingCollection, name: string) => {
    if (!deps) return;
    const next = { ...collection, name: cleanName(name, collection.name) };
    await deps.store.saveCollection(next);
    state.setCollections((list) => replaceById(list, next));
  }, [deps]);

  const remove = useCallback(async (id: string) => {
    if (!deps) return;
    const unfiled = await removeCollection(deps, id, state.drawingsRef.current);
    state.setCollections((list) => list.filter((collection) => collection.id !== id));
    state.setDrawings((list) => unfiled.reduce(replaceById, list));
  }, [deps]);

  return { add, rename, remove };
};

// Salvar conteúdo marca "editado agora"; miniatura não mexe na data.
const useAutosaveSinks = (deps: LibraryDeps | null, state: LibraryState, patch: (id: string, change: Partial<DrawingMeta>) => Promise<void>) =>
  useMemo(() => ({
    saveContent: async (id: string, scene: string, book: ScenarioBook) => {
      const found = state.drawingsRef.current.find((drawing) => drawing.id === id);
      if (!deps || !found) return;
      const next = { ...found, updatedAt: deps.now() };
      await deps.store.saveDrawing(next, { id, scene, book });
      state.setDrawings((list) => replaceById(list, next));
    },
    saveThumbnail: (id: string, thumbnail: string | null) => patch(id, { thumbnail }),
  }), [deps, patch]);

/**
 * Biblioteca "Meus desenhos": vários desenhos e coleções, um aberto por vez, tudo no armazenamento escolhido.
 * @example const library = useDrawingLibrary({ store, persistent: true }, templateFromUrl()); library.newFromTemplate("loja-nimbus-c4");
 */
export const useDrawingLibrary = (handle: StoreHandle | null, linked: DiagramTemplate | null) => {
  const state = useLibraryState();
  const deps = useMemo<LibraryDeps | null>(() => (handle ? { store: handle.store, now: Date.now, newId: () => crypto.randomUUID() } : null), [handle]);
  const report = useReporter(state);
  const open = useOpen(deps, state);
  useBoot({ handle, deps, linked }, state, open);
  const actions = useDrawingActions(deps, state, open);
  const collectionActions = useCollectionActions(deps, state);
  const sinks = useAutosaveSinks(deps, state, actions.patch);

  const newFromTemplate = useCallback(async (templateId: string) => {
    const template = findTemplate(templateId);
    if (!template) throw new Error(`modelo "${templateId}" não existe`);
    await actions.createAndOpen(await templateDrawing(template));
  }, [actions.createAndOpen]);

  return {
    drawings: state.drawings, collections: state.collections, current: state.current, error: state.error, persistent: handle?.persistent ?? true,
    sinks, clearError: () => state.setError(null),
    open: report(open),
    newBlank: report((collectionId: string | null) => actions.createAndOpen({ ...blankDrawing("Sem título"), collectionId })),
    newFromTemplate: report(newFromTemplate),
    rename: report((id: string, name: string) => actions.patch(id, { name: cleanName(name, "Sem título") })),
    move: report((id: string, collectionId: string | null) => actions.patch(id, { collectionId })),
    duplicate: report(actions.duplicate),
    remove: report(actions.remove),
    addCollection: report(collectionActions.add),
    renameCollection: report(collectionActions.rename),
    removeCollection: report(collectionActions.remove),
  };
};

export type DrawingLibrary = ReturnType<typeof useDrawingLibrary>;
