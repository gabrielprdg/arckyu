import type { ExcalidrawElementSkeleton } from "@excalidraw/excalidraw/data/transform";
import type { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import { buildTemplateSkeletons, templateEdges, templateIconRefs, type DiagramTemplate } from "../arch/diagramTemplate";
import { iconFile, toElements, toFileId, toLinearPoints } from "../arch/excalidrawAdapter";
import { buildScenarioSteps } from "../flow/scenario";
import { findIcon, ICON_CATALOG } from "../icons/catalog";
import { resolveIconDataUrl } from "../icons/iconImage";
import { toCanvasImage } from "../icons/rasterize";
import type { ScenarioBook } from "./scenarioBook";

const browserFetch = (url: string, init?: { signal?: AbortSignal }) => fetch(url, init);

const templateFiles = async (template: DiagramTemplate) => {
  const files = await Promise.all(templateIconRefs(template).map(async (ref) => {
    const icon = findIcon(ICON_CATALOG, ref);
    if (!icon) throw new Error(`modelo "${template.id}": ícone "${ref}" não está no catálogo`);
    return iconFile(ref, await toCanvasImage(await resolveIconDataUrl(icon, { fetchFn: browserFetch })));
  }));
  return Object.fromEntries(files.map((file) => [file.id, file]));
};

const templateStrings = (template: DiagramTemplate): string =>
  [
    ...template.cards.flatMap((card) => [card.name, card.caption ?? ""]),
    ...template.arrows.map((arrow) => arrow.label),
    ...template.boundaries.map((boundary) => boundary.name),
    ...template.texts.map((text) => text.text),
  ].join(" ");

// A Excalifont vem em pedaços por faixa de caracteres; se "·" ou acentos ainda não baixaram, o Excalidraw mede o
// texto com a fonte reserva (mais estreita) e depois corta o que passa da largura medida.
const ensureFontsFor = async (template: DiagramTemplate): Promise<void> => {
  try {
    await document.fonts.load("20px Excalifont", templateStrings(template));
  } catch {
    // Sem a API de fontes: segue com a medição que der.
  }
};

const toSkeletons = (template: DiagramTemplate): ExcalidrawElementSkeleton[] => {
  const { cards, arrows, boundaries, texts } = buildTemplateSkeletons(template, toFileId, ICON_CATALOG);
  // Fronteiras primeiro: ficam no fundo (z-order = ordem do array).
  return [...boundaries, ...texts, ...cards, ...arrows.map((arrow) => ({ ...arrow, points: toLinearPoints(arrow.points) }))];
};

/** Cena de um modelo; assíncrona porque os logos vêm do Iconify. */
export const createTemplateScene = async (template: DiagramTemplate): Promise<ExcalidrawInitialDataState> => {
  const [files] = await Promise.all([templateFiles(template), ensureFontsFor(template)]);
  return { elements: toElements(toSkeletons(template)), files, appState: { currentItemRoughness: 1 }, scrollToContent: true };
};

export const templateScenarioBook = (template: DiagramTemplate): ScenarioBook => ({
  scenarios: template.scenarios.map((scenario) => ({ name: scenario.name, steps: buildScenarioSteps(scenario.path, templateEdges(template)) })),
  active: 0,
});
