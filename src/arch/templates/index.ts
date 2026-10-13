import type { DiagramTemplate } from "../diagramTemplate";
import { lojaNimbusC4Template } from "./lojaNimbusC4";
import { serverlessTemplate } from "./serverless";

export const TEMPLATES: readonly DiagramTemplate[] = [serverlessTemplate, lojaNimbusC4Template];

export const DEFAULT_TEMPLATE = serverlessTemplate;

export const findTemplate = (id: string): DiagramTemplate | undefined => TEMPLATES.find((template) => template.id === id);
