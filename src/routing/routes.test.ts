import { describe, expect, it } from "vitest";
import { loginPathFor, routeOf, safeNext } from "./routes";

describe("routeOf", () => {
  it("acha a página pelo caminho", () => expect(routeOf("/entrar")).toBe("login"));
  it("ignora barra no fim", () => expect(routeOf("/app/")).toBe("app"));
  it("raiz é a landing", () => expect(routeOf("/")).toBe("landing"));
  it("caminho desconhecido", () => expect(routeOf("/xpto")).toBe("notFound"));
});

describe("safeNext", () => {
  it("aceita caminho interno com query", () => expect(safeNext("/app?modelo=serverless")).toBe("/app?modelo=serverless"));
  it("recusa outro site", () => expect(safeNext("//evil.com/x")).toBe("/app"));
  it("recusa URL absoluta", () => expect(safeNext("https://evil.com")).toBe("/app"));
  it("recusa barra invertida", () => expect(safeNext("/\\evil.com")).toBe("/app"));
  it("vazio vai para o app", () => expect(safeNext(null)).toBe("/app"));
});

describe("loginPathFor", () => {
  it("codifica o destino", () => expect(loginPathFor("/app?modelo=x")).toBe("/entrar?next=%2Fapp%3Fmodelo%3Dx"));
});
