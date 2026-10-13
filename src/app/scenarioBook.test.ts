import { describe, expect, it } from "vitest";
import { activeScenario, addScenario, EMPTY_BOOK, selectScenario } from "./scenarioBook";

const scenario = (name: string) => ({ name, steps: [] });

describe("scenarioBook", () => {
  it("livro vazio não tem cenário ativo", () => expect(activeScenario(EMPTY_BOOK)).toBeNull());
  it("cenário gravado entra no fim e fica ativo", () => {
    const book = addScenario(addScenario(EMPTY_BOOK, scenario("a")), scenario("b"));
    expect(activeScenario(book)?.name).toBe("b");
  });
  it("seleção fora do intervalo é ignorada", () => {
    const book = addScenario(EMPTY_BOOK, scenario("a"));
    expect(selectScenario(book, 5)).toBe(book);
  });
});
