import { describe, expect, it } from "vitest";
import { ICON_CATALOG } from "./catalog";
import { searchIcons } from "./searchIcons";

const names = (query: string): string[] => searchIcons(ICON_CATALOG, query).map((icon) => icon.name);

describe("searchIcons", () => {
  it("acha por alias curto", () => expect(names("pg")).toContain("PostgreSQL"));
  it("ignora acento e caixa", () => expect(names("USUARIO")).toContain("Usuário"));
  it("acha serviço cloud por alias", () => expect(names("serverless")).toContain("Lambda"));
  it("query vazia devolve tudo", () => expect(searchIcons(ICON_CATALOG, "  ")).toHaveLength(ICON_CATALOG.length));
});
