import { useEffect } from "react";
import { findTemplate } from "../arch/templates";
import type { DiagramTemplate } from "../arch/diagramTemplate";

const TEMPLATE_PARAM = "modelo";

/**
 * Link direto: `?modelo=loja-nimbus-c4` cria um desenho novo a partir do modelo.
 * @example templateFromUrl() // lojaNimbusC4Template quando a URL tem ?modelo=loja-nimbus-c4
 */
export const templateFromUrl = (): DiagramTemplate | null =>
  findTemplate(new URL(window.location.href).searchParams.get(TEMPLATE_PARAM) ?? "") ?? null;

/** Tira o parâmetro da URL depois de lido, para um refresh não criar outro desenho igual. */
export const useStripTemplateParam = (): void => {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(TEMPLATE_PARAM)) return;
    url.searchParams.delete(TEMPLATE_PARAM);
    window.history.replaceState(null, "", url);
  }, []);
};
