import { describe, expect, it } from "vitest";
import type { IconDefinition } from "./catalog";
import type { FetchLike } from "./iconifyClient";
import { resolveIconDataUrl, svgToDataUrl, wrapTileSvg } from "./iconImage";

describe("wrapTileSvg", () => {
  it("centraliza o glifo e pinta o fundo", () => {
    const svg = wrapTileSvg('<svg width="34"></svg>', "#f97316");
    expect(svg).toContain('fill="#f97316"');
    expect(svg).toContain('<svg x="15" y="15" width="34">');
  });
});

describe("svgToDataUrl", () => {
  it("codifica UTF-8 em base64", () =>
    expect(atob(svgToDataUrl("<svg>é</svg>").split(",")[1])).toBe(String.fromCodePoint(...new TextEncoder().encode("<svg>é</svg>"))));
});

/** Fake que sempre falha, simulando ficar sem rede. */
class OfflineFetch {
  calls = 0;
  readonly fn: FetchLike = async () => {
    this.calls += 1;
    throw new Error("offline");
  };
}

const icon = (patch: Partial<IconDefinition>): IconDefinition => ({ ref: "x", name: "X", category: "compute", aliases: [], source: { kind: "lucide" }, ...patch });

describe("resolveIconDataUrl", () => {
  it("devolve o upload sem rede", async () =>
    expect(await resolveIconDataUrl(icon({ source: { kind: "upload", dataUrl: "data:image/png;base64,AA" } }), { fetchFn: new OfflineFetch().fn })).toBe("data:image/png;base64,AA"));
  it("cai no glifo genérico quando o Iconify falha", async () => {
    const url = await resolveIconDataUrl(icon({ ref: "offline-1", source: { kind: "iconify", id: "logos:docker-icon" } }), { fetchFn: new OfflineFetch().fn });
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });
  it("busca cada logo uma vez só (cache)", async () => {
    const offline = new OfflineFetch();
    const docker = icon({ ref: "cache-1", source: { kind: "iconify", id: "logos:docker-icon" } });
    await resolveIconDataUrl(docker, { fetchFn: offline.fn });
    await resolveIconDataUrl(docker, { fetchFn: offline.fn });
    expect(offline.calls).toBe(1);
  });
});
