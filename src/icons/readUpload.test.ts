import { describe, expect, it } from "vitest";
import { validateUpload } from "./readUpload";

describe("validateUpload", () => {
  it("aceita SVG pequeno", () => expect(validateUpload({ name: "keda.svg", type: "image/svg+xml", size: 2048 })).toBeNull());
  it("recusa tipo não suportado dizendo o tipo", () =>
    expect(validateUpload({ name: "a.gif", type: "image/gif", size: 10 })).toContain("image/gif"));
  it("recusa arquivo grande dizendo o tamanho", () =>
    expect(validateUpload({ name: "big.png", type: "image/png", size: 900 * 1024 })).toContain("900 KB"));
});
