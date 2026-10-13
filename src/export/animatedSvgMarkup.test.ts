import { describe, expect, it } from "vitest";
import { lineGraph } from "./__fixtures__/exportScene";
import { ambientSvgMarkup, playSvgMarkup } from "./animatedSvgMarkup";

const lengths = new Map([["e1", 120], ["e2", 120]]);
const count = (text: string, needle: string) => text.split(needle).length - 1;

describe("ambientSvgMarkup", () => {
  it("três bolinhas por seta seguindo o path, defasadas", () => {
    const markup = ambientSvgMarkup(lineGraph().flows, lengths);
    expect([count(markup, "<circle"), markup.includes('path="M80 40 L200 40" dur="1.5s" begin="-0.5s"')]).toEqual([6, true]);
  });
  it("seta sem comprimento não ganha bolinha", () => expect(ambientSvgMarkup(lineGraph().flows, new Map())).toBe(""));
  it("escapa cor vinda da cena", () => {
    const flows = lineGraph().flows.map((flow) => ({ ...flow, flow: { ...flow.flow, color: '"><x' } }));
    expect(ambientSvgMarkup(flows, lengths)).toContain('fill="&quot;&gt;&lt;x"');
  });
});

describe("playSvgMarkup", () => {
  const steps = [{ edgeId: "e1", reverse: false }, { edgeId: "e2", reverse: true }];
  const area = { x: -32, y: -32, width: 544, height: 144 };
  const markup = playSvgMarkup(lineGraph(), steps, 1, area);
  it("relógio mestre reinicia o loop no fim", () => expect(markup).toContain('dur="3.7s" begin="0s;arckyu-loop.end"'));
  it("cada passo aparece na sua janela; o último segura até o fim", () =>
    expect(markup).toContain('begin="arckyu-loop.begin+1.1s" dur="2.6s"'));
  it("passo de volta inverte o pacote", () => expect(count(markup, 'keyPoints="1;0"')).toBe(1));
});
