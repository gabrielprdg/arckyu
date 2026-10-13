import { useRef, type MutableRefObject } from "react";
import { useRafLoop } from "../flow/useRafLoop";

/** Pacote do modo play: lê o progresso do passo atual (ref) e se posiciona na aresta. */
export const RequestPacket = ({ path, reverse, progressRef }: { path: string; reverse: boolean; progressRef: MutableRefObject<number> }) => {
  const trackRef = useRef<SVGPathElement>(null);
  const groupRef = useRef<SVGGElement>(null);

  useRafLoop(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;
    const fraction = reverse ? 1 - progressRef.current : progressRef.current;
    const point = track.getPointAtLength(fraction * track.getTotalLength());
    group.setAttribute("transform", `translate(${point.x} ${point.y})`);
    group.setAttribute("opacity", "1");
  }, true);

  return (
    <g className="request-packet">
      <path ref={trackRef} d={path} fill="none" stroke="none" />
      <g ref={groupRef} opacity={0}>
        <circle r={11} className="request-packet__halo" />
        <circle r={5} className="request-packet__core" />
      </g>
    </g>
  );
};
