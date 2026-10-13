import type { Scenario } from "../model/types";

/** Cenários do diagrama atual e qual deles o play toca. */
export type ScenarioBook = { scenarios: Scenario[]; active: number };

export const EMPTY_BOOK: ScenarioBook = { scenarios: [], active: 0 };

export const activeScenario = (book: ScenarioBook): Scenario | null => book.scenarios[book.active] ?? null;

/** Cenário gravado entra no fim e já fica selecionado. @example addScenario(book, gravado).active // último índice */
export const addScenario = (book: ScenarioBook, scenario: Scenario): ScenarioBook => ({
  scenarios: [...book.scenarios, scenario],
  active: book.scenarios.length,
});

export const selectScenario = (book: ScenarioBook, index: number): ScenarioBook =>
  index >= 0 && index < book.scenarios.length ? { ...book, active: index } : book;
