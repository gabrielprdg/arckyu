import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ReactNode } from "react";
import { arrowCommunication, DEFAULT_FLOW, readFlowData, withArchData } from "../arch/archData";
import type { Communication, FlowDirection, FlowSettings, IconCategory, RenderFlow } from "../model/types";
import { CardInspector, type CardEditActions } from "./CardInspector";

export type InspectorTarget =
  | { kind: "card"; element: ExcalidrawElement; name: string; caption: string; category: IconCategory }
  | { kind: "arrow"; element: ExcalidrawElement; connected: boolean; flow: RenderFlow | null }
  | null;

type InspectorProps = CardEditActions & { target: InspectorTarget };

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="field"><span>{label}</span>{children}</label>
);

const DIRECTIONS: readonly [FlowDirection, string][] = [["forward", "Ida →"], ["backward", "Volta ←"], ["both", "Bidirecional ⇄"]];

const STOPPED: FlowSettings = { ...DEFAULT_FLOW, animated: false, packets: false };

// Sem customData, vale o que o grafo decidiu: ligada a dois cards anima; solta fica parada.
const settingsOf = (element: ExcalidrawElement, effective: RenderFlow | null): FlowSettings => {
  const saved = readFlowData(element)?.flow;
  if (saved) return saved;
  if (!effective) return STOPPED;
  return { animated: effective.animated, direction: effective.direction, speed: effective.speed, packets: effective.packets };
};

type ArrowInspectorProps = { element: ExcalidrawElement; connected: boolean; effective: RenderFlow | null; onPatch: InspectorProps["onPatch"] };

const ArrowInspector = ({ element, connected, effective, onPatch }: ArrowInspectorProps) => {
  const flow = settingsOf(element, effective);
  const communication = arrowCommunication(element);
  // Grava sempre flow + communication juntos: mudar uma opção não pode apagar a outra.
  const save = (next: { flow?: Partial<FlowSettings>; communication?: Communication }) =>
    onPatch(element.id, withArchData(element.customData, { kind: "flow", flow: { ...flow, ...next.flow }, communication: next.communication ?? communication }));
  const set = (patch: Partial<FlowSettings>) => save({ flow: patch });
  return (
    <div key={element.id}>
      <h2>Fluxo da seta</h2>
      <Field label="Comunicação">
        <select value={communication} onChange={(e) => save({ communication: e.target.value === "async" ? "async" : "sync" })}>
          <option value="sync">Síncrona (HTTP / gRPC / SQL)</option>
          <option value="async">Assíncrona (fila / evento)</option>
        </select>
      </Field>
      <p className="hint">Cor, espessura e estilo do traço ficam no painel do próprio Excalidraw. O rótulo do protocolo é texto da seta (duplo clique).</p>
      {!connected && <p className="hint">Seta solta (as duas pontas não estão grudadas em cards): ligue “Pacotes” ou “Tracejado em movimento” para animar mesmo assim.</p>}
      <label className="toggle"><input type="checkbox" checked={flow.animated} onChange={(e) => set({ animated: e.target.checked })} /> Tracejado em movimento</label>
      <label className="toggle"><input type="checkbox" checked={flow.packets} onChange={(e) => set({ packets: e.target.checked })} /> Pacotes (bolinhas)</label>
      <Field label="Direção">
        <select value={flow.direction} onChange={(e) => {
          const picked = DIRECTIONS.find(([key]) => key === e.target.value);
          if (picked) set({ direction: picked[0] });
        }}>
          {DIRECTIONS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </Field>
      <Field label={`Velocidade · ${flow.speed} px/s`}>
        <input type="range" min={10} max={200} value={flow.speed} onChange={(e) => set({ speed: Number(e.target.value) })} />
      </Field>
    </div>
  );
};

const EmptyInspector = () => (
  <div>
    <h2>Propriedades</h2>
    <p className="hint">Desenhe à vontade com as ferramentas do Excalidraw. Selecione um card ou uma seta para ver as propriedades de arquitetura.</p>
    <ul className="hint">
      <li>Seta (<kbd>A</kbd>) ligando dois cards já nasce animada.</li>
      <li>Traço tracejado = assíncrono.</li>
      <li><kbd>Alt</kbd>+<kbd>P</kbd> pausa todas as animações.</li>
    </ul>
  </div>
);

export const Inspector = ({ target, ...actions }: InspectorProps) => (
  <aside className="panel inspector">
    {target?.kind === "card" && <CardInspector key={target.element.id} element={target.element} name={target.name} caption={target.caption} category={target.category} {...actions} />}
    {target?.kind === "arrow" && <ArrowInspector element={target.element} connected={target.connected} effective={target.flow} onPatch={actions.onPatch} />}
    {!target && <EmptyInspector />}
  </aside>
);
