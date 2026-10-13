import { describe, expect, it } from "vitest";
import { containRect, isSvgDataUrl, meanLuminance, needsBackdrop } from "./rasterize";

describe("containRect", () => {
  it("encaixa logo largo centralizado na vertical", () =>
    expect(containRect(200, 100, 256)).toEqual({ x: 0, y: 64, w: 256, h: 128 }));
  it("mantém quadrado ocupando tudo", () => expect(containRect(64, 64, 256)).toEqual({ x: 0, y: 0, w: 256, h: 256 }));
  it("trata dimensão desconhecida (0) como quadrado", () => expect(containRect(0, 0, 256)).toEqual({ x: 0, y: 0, w: 256, h: 256 }));
});

describe("meanLuminance / needsBackdrop", () => {
  const black = [0, 0, 0, 255];
  const white = [255, 255, 255, 255];
  const transparent = [255, 255, 255, 0];
  it("ignora pixels transparentes", () => expect(meanLuminance([...black, ...transparent])).toBe(0));
  it("devolve null para imagem toda transparente", () => expect(meanLuminance(transparent)).toBeNull());
  it("logo preto (Kafka) pede fundo claro", () => expect(needsBackdrop(meanLuminance([...black, ...black]))).toBe(true));
  it("logo claro/colorido fica como está", () => expect(needsBackdrop(meanLuminance([...white, ...black]))).toBe(false));
  it("imagem vazia não ganha fundo", () => expect(needsBackdrop(null)).toBe(false));
});

describe("isSvgDataUrl", () => {
  it("reconhece SVG", () => expect(isSvgDataUrl("data:image/svg+xml;base64,AA")).toBe(true));
  it("não confunde PNG", () => expect(isSvgDataUrl("data:image/png;base64,AA")).toBe(false));
});
