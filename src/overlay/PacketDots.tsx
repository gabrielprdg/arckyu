import { useRef } from "react";
import { PACKET_COUNT, packetFractions } from "../flow/flowMath";
import { useRafLoop } from "../flow/useRafLoop";
import type { RenderFlow } from "../model/types";

const placeCircle = (circle: SVGCircleElement | null, track: SVGPathElement, fraction: number): void => {
  if (!circle) return;
  const point = track.getPointAtLength(fraction * track.getTotalLength());
  circle.setAttribute("cx", String(point.x));
  circle.setAttribute("cy", String(point.y));
  circle.setAttribute("opacity", "1");
};

/** Bolinhas percorrendo a aresta; posição via getPointAtLength num loop rAF (pausa sem perder o lugar). */
export const PacketDots = ({ path, flow, paused }: { path: string; flow: RenderFlow; paused: boolean }) => {
  const trackRef = useRef<SVGPathElement>(null);
  const circlesRef = useRef<(SVGCircleElement | null)[]>([]);
  const elapsedRef = useRef(0);

  useRafLoop((deltaMs) => {
    const track = trackRef.current;
    if (!track) return;
    elapsedRef.current += deltaMs;
    packetFractions(flow, track.getTotalLength(), elapsedRef.current)
      .forEach((fraction, index) => placeCircle(circlesRef.current[index] ?? null, track, fraction));
  }, !paused);

  return (
    <g className="flow-packets">
      <path ref={trackRef} d={path} fill="none" stroke="none" />
      {Array.from({ length: PACKET_COUNT }, (_, index) => (
        <circle key={index} ref={(el) => { circlesRef.current[index] = el; }} r={flow.width + 2} fill={flow.color} className="flow-packet" opacity={0} />
      ))}
    </g>
  );
};
