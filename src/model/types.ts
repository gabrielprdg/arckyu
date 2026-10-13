/** Categorias conhecidas têm cor e rótulo próprios; o usuário pode criar outras (texto livre). */
export type IconCategory = string;

export type FlowDirection = "forward" | "backward" | "both";
export type Communication = "sync" | "async";

/** Configuração do fluxo animado guardada no customData da seta; cor e espessura são da própria seta. */
export type FlowSettings = {
  animated: boolean;
  direction: FlowDirection;
  /** Velocidade aparente em px/s, independente do zoom. */
  speed: number;
  packets: boolean;
};

/** FlowSettings + aparência lida da seta do Excalidraw, pronto para desenhar. */
export type RenderFlow = FlowSettings & { color: string; width: number };

export type ArchCardData = {
  kind: "card";
  iconRef: string;
  technology: string;
  owner: string;
  description: string;
};

// `communication` explícita vence; sem ela, deriva do strokeStyle nativo da seta (dashed/dotted = async).
export type ArchFlowData = {
  kind: "flow";
  flow: FlowSettings;
  communication?: Communication;
};

/** Aresta do grafo derivada de uma seta ligada a dois cards. */
export type GraphEdge = { id: string; source: string; target: string };

export type ScenarioStep = {
  edgeId: string;
  /** true quando o passo percorre a seta de target para source (resposta). */
  reverse: boolean;
};

export type Scenario = { name: string; steps: ScenarioStep[] };
