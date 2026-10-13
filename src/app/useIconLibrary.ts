import { useCallback, useMemo, useState } from "react";
import { ICON_CATALOG, type IconDefinition } from "../icons/catalog";
import { CATEGORY_ORDER } from "../icons/categoryStyle";
import { loadCustomIcons, loadIconOverrides, saveCustomIcons, saveIconOverrides } from "../icons/customIconStore";
import { applyOverrides, isCustomRef, removeByRef, upsertByRef, withoutKey } from "../icons/libraryOps";
import type { IconCategory } from "../model/types";

type SaveResult = { saved: boolean };

export type IconLibrary = {
  icons: readonly IconDefinition[];
  categories: readonly IconCategory[];
  find: (ref: string) => IconDefinition | undefined;
  addCustom: (icon: IconDefinition) => SaveResult;
  /** Item do usuário: substitui. Item padrão: guarda como personalização (o catálogo original fica intacto). */
  updateIcon: (icon: IconDefinition) => SaveResult;
  removeCustom: (ref: string) => SaveResult;
  resetOverride: (ref: string) => SaveResult;
  isOverridden: (ref: string) => boolean;
};

const useStoredList = () => {
  const [custom, setCustom] = useState<IconDefinition[]>(loadCustomIcons);
  const commit = useCallback((next: IconDefinition[]): SaveResult => {
    setCustom(next);
    return { saved: saveCustomIcons(next) };
  }, []);
  return { custom, commit };
};

const useStoredOverrides = () => {
  const [overrides, setOverrides] = useState<Record<string, IconDefinition>>(loadIconOverrides);
  const commit = useCallback((next: Record<string, IconDefinition>): SaveResult => {
    setOverrides(next);
    return { saved: saveIconOverrides(next) };
  }, []);
  return { overrides, commit };
};

/** Catálogo padrão (com personalizações) + itens criados pelo usuário, persistidos no navegador. */
export const useIconLibrary = (): IconLibrary => {
  const list = useStoredList();
  const stored = useStoredOverrides();
  const { overrides } = stored;
  const icons = useMemo(() => [...applyOverrides(ICON_CATALOG, overrides), ...list.custom], [overrides, list.custom]);
  const categories = useMemo(() => [...new Set([...CATEGORY_ORDER, ...icons.map((icon) => icon.category)])], [icons]);
  const find = useCallback((ref: string) => icons.find((icon) => icon.ref === ref), [icons]);

  const addCustom = useCallback((icon: IconDefinition) => list.commit([...list.custom, icon]), [list]);
  const updateIcon = useCallback((icon: IconDefinition) =>
    isCustomRef(icon.ref) ? list.commit(upsertByRef(list.custom, icon)) : stored.commit({ ...overrides, [icon.ref]: icon }), [list, stored, overrides]);
  const removeCustom = useCallback((ref: string) => list.commit(removeByRef(list.custom, ref)), [list]);
  const resetOverride = useCallback((ref: string) => stored.commit(withoutKey(overrides, ref)), [stored, overrides]);
  const isOverridden = useCallback((ref: string) => ref in overrides, [overrides]);

  return { icons, categories, find, addCustom, updateIcon, removeCustom, resetOverride, isOverridden };
};
