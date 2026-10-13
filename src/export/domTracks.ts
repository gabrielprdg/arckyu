import type { FlowArrow } from "../arch/sceneGraph";
import type { FlowTrack, FlowTracks } from "./overlayPainter";

const SVG_NS = "http://www.w3.org/2000/svg";

const trackOf = (element: SVGPathElement, d: string): FlowTrack => {
  const length = element.getTotalLength();
  const path2d = new Path2D(d);
  return {
    length,
    pointAt: (fraction) => {
      const point = element.getPointAtLength(fraction * length);
      return { x: point.x, y: point.y };
    },
    strokeOn: (surface) => surface.stroke(path2d),
  };
};

/**
 * Geometria das setas medida pelo navegador (getPointAtLength), igual à camada animada da tela.
 * @example const { tracks, dispose } = createDomTracks(graph.flows); … dispose();
 */
export const createDomTracks = (flows: readonly FlowArrow[]): { tracks: FlowTracks; dispose: () => void } => {
  // SVG oculto no documento: medir path solto não é garantido em todos os navegadores.
  const host = document.createElementNS(SVG_NS, "svg");
  host.setAttribute("style", "position:absolute;width:0;height:0;overflow:hidden");
  host.setAttribute("aria-hidden", "true");
  document.body.append(host);
  const tracks = new Map(flows.map((flow) => {
    const element = document.createElementNS(SVG_NS, "path");
    element.setAttribute("d", flow.path);
    host.append(element);
    return [flow.id, trackOf(element, flow.path)] as const;
  }));
  return { tracks, dispose: () => host.remove() };
};
