import { describe, expect, it } from "vitest";
import { buildScenarioSteps } from "../../flow/scenario";
import { ICON_CATALOG } from "../../icons/catalog";
import { buildTemplateSkeletons, relativePoints, scaleLayout, templateEdges, templateIconRefs } from "../diagramTemplate";
import { TEMPLATES } from "./index";
import { lojaNimbusC4Template } from "./lojaNimbusC4";

describe.each(TEMPLATES.map((t) => [t.id, t] as const))("modelo %s", (_id, template) => {
  it("todo ícone existe no catálogo", () =>
    expect(templateIconRefs(template).filter((ref) => !ICON_CATALOG.some((icon) => icon.ref === ref))).toEqual([]));
  it("toda seta liga cards existentes", () =>
    expect(() => buildTemplateSkeletons(template, (ref) => ref, ICON_CATALOG)).not.toThrow());
  it("fronteiras não usam frame do Excalidraw (que corta setas)", () =>
    expect(new Set<string>(buildTemplateSkeletons(template, (ref) => ref, ICON_CATALOG).boundaries.map((el) => el.type)).has("frame")).toBe(false));
  it("todo cenário é um caminho percorrível pelas setas", () => {
    for (const scenario of template.scenarios) {
      const steps = buildScenarioSteps(scenario.path, templateEdges(template));
      // Sem saltos: cada par consecutivo do caminho vira exatamente um passo.
      expect({ name: scenario.name, steps: steps.length }).toEqual({ name: scenario.name, steps: scenario.path.length - 1 });
    }
  });
  it("ids de elementos são únicos", () => {
    const { cards, arrows, boundaries, texts } = buildTemplateSkeletons(template, (ref) => ref, ICON_CATALOG);
    const ids = [...cards, ...arrows, ...boundaries, ...texts].map((el) => el.id);
    expect(ids.length).toBe(new Set(ids).size);
  });
});

describe("relativePoints", () => {
  it("leva pontos absolutos para a origem da seta", () =>
    expect(relativePoints([[10, 20], [10, -60], [110, -60]])).toEqual([[0, 0], [0, -80], [100, -80]]));
});

describe("scaleLayout", () => {
  const base = TEMPLATES[0];
  it("multiplica posições e rotas, mas mantém o card do mesmo tamanho", () => {
    const scaled = scaleLayout({ ...base, arrows: [{ ...base.arrows[0], via: [[100, -50]] }] }, 2);
    expect(scaled.cards[1]).toMatchObject({ x: base.cards[1].x * 2, y: base.cards[1].y * 2 });
    expect(scaled.arrows[0].via).toEqual([[200, -100]]);
  });
});

describe.each([["loja nimbus", lojaNimbusC4Template]] as const)("legibilidade do modelo %s", (_name, template) => {
  // Estimativa de largura de texto (Excalifont ≈ 0,55 em por caractere) para garantir que vizinhos na mesma linha não colidam.
  const widthOf = (text: string, fontSize: number) => Math.max(...text.split("\n").map((line) => line.length)) * fontSize * 0.55;
  it("textos de cards vizinhos na mesma linha não se sobrepõem", () => {
    const fonts = template.fonts ?? { cardLabel: 16, caption: 12, arrowLabel: 13, boundary: 16 };
    const spans = template.cards.map((card) => {
      const half = Math.max(widthOf(card.name, fonts.cardLabel), widthOf(card.caption ?? "", fonts.caption)) / 2;
      const center = card.x + (template.cardSize ?? 84) / 2;
      return { id: card.id, y: card.y, from: center - half, to: center + half };
    });
    const overlaps = spans.flatMap((a) => spans.filter((b) => a.id < b.id && a.y === b.y && a.from < b.to && b.from < a.to).map((b) => `${a.id}×${b.id}`));
    expect(overlaps).toEqual([]);
  });
});
