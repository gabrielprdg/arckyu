import { antsLayersFor, cssDirectionFor, dashCycleLength, flowCycleSeconds, type AntsLayer } from "../flow/flowMath";
import type { Communication, RenderFlow } from "../model/types";
import type { CssVarStyle } from "./cssVars";

const AntsPath = ({ path, layer, flow }: { path: string; layer: AntsLayer; flow: RenderFlow }) => {
  const style: CssVarStyle = {
    "--dash-cycle": dashCycleLength(layer.pattern),
    animationDuration: `${flowCycleSeconds(layer.pattern, flow.speed)}s`,
    animationDirection: cssDirectionFor(layer.direction),
  };
  return (
    <path d={path} className="flow-ants" fill="none" stroke={layer.stroke} strokeWidth={flow.width}
      strokeDasharray={layer.pattern.join(" ")} strokeLinecap="round" style={style} />
  );
};

/** Traço em movimento (stroke-dashoffset animado por CSS); "both" sobrepõe ida e volta. */
export const MarchingAnts = ({ path, flow, communication }: { path: string; flow: RenderFlow; communication: Communication }) => (
  <>
    {antsLayersFor(flow, communication).map((layer) => <AntsPath key={layer.direction} path={path} layer={layer} flow={flow} />)}
  </>
);
