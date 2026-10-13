import { EMPTY_BOOK } from "../app/scenarioBook";
import { loadLocalScenarioBook, loadLocalScene } from "../app/localScene";
import type { NewDrawing } from "./drawingLibrary";

const LAST_OPENED_KEY = "arckyu:lastDrawing";
const MIGRATED_KEY = "arckyu:legacyMigrated";

// Preferências por navegador: falhar ao ler/gravar só faz o app esquecer (nunca quebra).
const read = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // sem storage: ignora
  }
};

export const lastOpenedDrawing = (): string | null => read(LAST_OPENED_KEY);
export const rememberOpenedDrawing = (id: string): void => write(LAST_OPENED_KEY, id);

/** Desenho da versão de um canvas só (localStorage), para virar o primeiro da biblioteca; null se já migrou. */
export const legacyDrawing = (): NewDrawing | null => {
  if (read(MIGRATED_KEY)) return null;
  const scene = loadLocalScene();
  if (!scene) return null;
  return { name: "Meu desenho", scene: JSON.stringify(scene), book: loadLocalScenarioBook() ?? EMPTY_BOOK };
};

/** As chaves antigas ficam no navegador (rede de segurança); a marca só impede migrar de novo. */
export const markLegacyMigrated = (): void => write(MIGRATED_KEY, "1");
