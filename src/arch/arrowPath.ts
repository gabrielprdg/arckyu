export type Point = readonly [number, number];

type ArrowGeometry = { x: number; y: number; points: readonly Point[]; roundness: unknown; elbowed?: boolean };

const fmt = (value: number): string => String(Math.round(value * 100) / 100);

export const absolutePoints = (arrow: ArrowGeometry): Point[] =>
  arrow.points.map(([px, py]): Point => [arrow.x + px, arrow.y + py]);

const polylineD = (points: readonly Point[]): string =>
  points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join(" ");

// Catmull-Rom → Bézier cúbica: aproxima a curva que o Excalidraw desenha em setas arredondadas.
const curveD = (points: readonly Point[]): string => {
  const segments = points.slice(1).map((end, i) => {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1: Point = [p1[0] + (end[0] - p0[0]) / 6, p1[1] + (end[1] - p0[1]) / 6];
    const c2: Point = [end[0] - (p3[0] - p1[0]) / 6, end[1] - (p3[1] - p1[1]) / 6];
    return `C${fmt(c1[0])} ${fmt(c1[1])} ${fmt(c2[0])} ${fmt(c2[1])} ${fmt(end[0])} ${fmt(end[1])}`;
  });
  return `M${fmt(points[0][0])} ${fmt(points[0][1])} ${segments.join(" ")}`;
};

/**
 * Path SVG (coordenadas de cena) que acompanha o traço da seta do Excalidraw.
 * @example arrowPathD({ x: 10, y: 10, points: [[0, 0], [100, 0]], roundness: null }) // "M10 10 L110 10"
 */
export const arrowPathD = (arrow: ArrowGeometry): string => {
  const points = absolutePoints(arrow);
  if (points.length < 2) return "";
  const curved = arrow.roundness !== null && !arrow.elbowed && points.length > 2;
  return curved ? curveD(points) : polylineD(points);
};
