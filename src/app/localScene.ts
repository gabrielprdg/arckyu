import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import type { Scenario } from "../model/types";
import type { ScenarioBook } from "./scenarioBook";

// Formato da versão de um canvas só; hoje só é lido uma vez, para migrar para "Meus desenhos".
const SCENE_KEY = "archflow:scene";
const SCENARIO_KEY = "archflow:scenario";
const SCENARIO_BOOK_KEY = "archflow:scenarios";

// Storage pode faltar (aba privada, bloqueio); nesses casos o app só não persiste.
const readJson = (key: string): unknown => {
  try {
    const text = window.localStorage.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};


const isSceneJson = (value: unknown): value is ExcalidrawInitialDataState =>
  typeof value === "object" && value !== null && "elements" in value && Array.isArray(value.elements);

export const loadLocalScene = (): ExcalidrawInitialDataState | null => {
  const raw = readJson(SCENE_KEY);
  return isSceneJson(raw) ? raw : null;
};


const isScenario = (value: unknown): value is Scenario =>
  typeof value === "object" && value !== null && "steps" in value && Array.isArray(value.steps);

const isScenarioBook = (value: unknown): value is ScenarioBook =>
  typeof value === "object" && value !== null && "scenarios" in value && Array.isArray(value.scenarios) && value.scenarios.every(isScenario) && "active" in value && typeof value.active === "number";

// Versões anteriores guardavam um único cenário em SCENARIO_KEY; vira um livro com ele.
export const loadLocalScenarioBook = (): ScenarioBook | null => {
  const book = readJson(SCENARIO_BOOK_KEY);
  if (isScenarioBook(book)) return book;
  const single = readJson(SCENARIO_KEY);
  return isScenario(single) ? { scenarios: [single], active: 0 } : null;
};


