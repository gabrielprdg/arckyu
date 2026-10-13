import { describe, expect, it } from "vitest";
import { fetchIconifySvg, searchIconify, type FetchLike } from "./iconifyClient";
import { iconifySvgUrl } from "./iconSource";

/** Fake do fetch: registra as URLs pedidas e devolve respostas programadas. */
class FakeFetch {
  readonly urls: string[] = [];
  constructor(private readonly reply: { ok?: boolean; status?: number; json?: unknown; text?: string }) {}
  readonly fn: FetchLike = async (url) => {
    this.urls.push(url);
    return { ok: this.reply.ok ?? true, status: this.reply.status ?? 200, json: async () => this.reply.json, text: async () => this.reply.text ?? "" };
  };
}

describe("searchIconify", () => {
  it("consulta só coleções de logos e devolve os ids", async () => {
    const fake = new FakeFetch({ json: { icons: ["logos:docker-icon"] } });
    expect(await searchIconify("docker", { fetchFn: fake.fn })).toEqual(["logos:docker-icon"]);
    expect(fake.urls[0]).toContain("prefixes=logos%2Cdevicon%2Csimple-icons%2Cskill-icons");
  });
  it("não chama a rede para termo curto", async () => {
    const fake = new FakeFetch({ json: { icons: [] } });
    expect(await searchIconify(" a ", { fetchFn: fake.fn })).toEqual([]);
    expect(fake.urls).toHaveLength(0);
  });
  it("explica falha HTTP com o termo", async () => {
    const fake = new FakeFetch({ ok: false, status: 503 });
    await expect(searchIconify("kafka", { fetchFn: fake.fn })).rejects.toThrow('"kafka": HTTP 503');
  });
  it("rejeita resposta fora do formato", async () => {
    const fake = new FakeFetch({ json: { nope: true } });
    await expect(searchIconify("redis", { fetchFn: fake.fn })).rejects.toThrow("esperado { icons: string[] }");
  });
});

describe("fetchIconifySvg / iconifySvgUrl", () => {
  it("pede o SVG em alta e devolve o texto", async () => {
    const fake = new FakeFetch({ text: "<svg/>" });
    expect(await fetchIconifySvg("logos:redis", { fetchFn: fake.fn })).toBe("<svg/>");
    expect(fake.urls[0]).toBe("https://api.iconify.design/logos/redis.svg?height=128");
  });
  it("só aplica cor em coleção monocromática", () => {
    expect(iconifySvgUrl("simple-icons:supabase", { color: "#3ecf8e" })).toContain("color=%233ecf8e");
    expect(iconifySvgUrl("logos:react", { color: "#3ecf8e" })).not.toContain("color");
  });
  it("valida o formato do id", () => expect(() => iconifySvgUrl("docker")).toThrow('recebido "docker"'));
});
