import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useCallback, useState } from "react";
import { sceneCenter } from "../arch/excalidrawAdapter";
import type { IconDefinition } from "../icons/catalog";
import { isCustomRef } from "../icons/libraryOps";
import type { ItemModalMode } from "../ui/NewItemModal";
import { insertCard } from "./useArchInsert";
import type { IconLibrary } from "./useIconLibrary";

const STORAGE_FULL = "O navegador não deixou salvar (armazenamento cheio?). A mudança some ao recarregar.";

const warnIfNotSaved = ({ saved }: { saved: boolean }): void => {
  if (!saved) window.alert(STORAGE_FULL);
};

/** Modal da paleta: criar (e opcionalmente inserir no centro) ou editar/apagar/restaurar um item, sem tocar no desenho. */
export const useNewItemModal = (api: ExcalidrawImperativeAPI | null, library: IconLibrary) => {
  const [mode, setMode] = useState<ItemModalMode | null>(null);

  const openWith = useCallback((name: string) => setMode({ kind: "create", suggestedName: name.trim() }), []);

  const openEdit = useCallback((icon: IconDefinition) => {
    const customizable = isCustomRef(icon.ref) ? "custom" : library.isOverridden(icon.ref) ? "overridden" : "default";
    setMode({ kind: "edit", icon, customizable });
  }, [library]);

  const close = useCallback(() => setMode(null), []);

  const create = useCallback((icon: IconDefinition, insertNow: boolean) => {
    warnIfNotSaved(library.addCustom(icon));
    setMode(null);
    if (insertNow && api) void insertCard(api, icon, sceneCenter(api.getAppState()));
  }, [api, library]);

  const save = useCallback((icon: IconDefinition) => {
    warnIfNotSaved(library.updateIcon(icon));
    setMode(null);
  }, [library]);

  const remove = useCallback((ref: string) => {
    if (!window.confirm("Apagar este item da paleta? Os cards que já estão no desenho continuam.")) return;
    warnIfNotSaved(library.removeCustom(ref));
    setMode(null);
  }, [library]);

  const reset = useCallback((ref: string) => {
    warnIfNotSaved(library.resetOverride(ref));
    setMode(null);
  }, [library]);

  return { mode, openWith, openEdit, close, create, save, remove, reset };
};
