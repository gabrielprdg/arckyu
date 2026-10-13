import type { ArchCardData, ArchFlowData, Communication, FlowSettings } from "../model/types";

// Padrão: só bolinhas (pacotes) andando sobre o traço; o tracejado em movimento fica opcional no inspetor.
export const DEFAULT_FLOW: FlowSettings = { animated: false, direction: "forward", speed: 40, packets: true };

type WithCustomData = { customData?: Record<string, unknown> };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isCardData = (value: unknown): value is ArchCardData =>
  isRecord(value) && value.kind === "card" && typeof value.iconRef === "string";

const isFlowData = (value: unknown): value is ArchFlowData =>
  isRecord(value) && value.kind === "flow" && isRecord(value.flow);

/** Dados de card guardados em customData.archflow; null se o elemento não é um card. */
export const readCardData = (element: WithCustomData): ArchCardData | null => {
  const data = element.customData?.archflow;
  return isCardData(data) ? data : null;
};

export const readFlowData = (element: WithCustomData): ArchFlowData | null => {
  const data = element.customData?.archflow;
  return isFlowData(data) ? data : null;
};

export const communicationOf = (strokeStyle: string): Communication => (strokeStyle === "solid" ? "sync" : "async");

/** Comunicação da seta: a guardada no customData ou, sem ela, a do estilo do traço. */
export const arrowCommunication = (arrow: WithCustomData & { strokeStyle: string }): Communication =>
  readFlowData(arrow)?.communication ?? communicationOf(arrow.strokeStyle);

export const withArchData = (customData: Record<string, unknown> | undefined, data: ArchCardData | ArchFlowData) => ({
  ...customData,
  archflow: data,
});
