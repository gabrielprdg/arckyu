import { buildSceneGraph, type SceneElementLike, type SceneGraph } from "../../arch/sceneGraph";
import type { FlowTrack, PaintSurface, TrackPoint } from "../overlayPainter";

const base = { isDeleted: false, y: 0, width: 80, height: 80, strokeColor: "#e03131", strokeWidth: 2, strokeStyle: "solid", roundness: null };

const card = (id: string, x: number): SceneElementLike => ({
  ...base, id, x, type: "rectangle", groupIds: [`g-${id}`],
  customData: { archflow: { kind: "card", iconRef: "generic:server", technology: "", owner: "", description: "" } },
});

const arrow = (id: string, from: string, to: string, x: number): SceneElementLike => ({
  ...base, id, x, y: 40, type: "arrow", groupIds: [], points: [[0, 0], [120, 0]],
  startBinding: { elementId: from }, endBinding: { elementId: to },
});

/** Três cards em linha (a → b → c), setas e1 e e2 com bolinhas. */
export const lineGraph = (): SceneGraph =>
  buildSceneGraph([card("a", 0), card("b", 200), card("c", 400), arrow("e1", "a", "b", 80), arrow("e2", "b", "c", 280)]);

/** Seta reta horizontal: comprimento conhecido sem precisar do DOM. */
export class StraightTrackFake implements FlowTrack {
  constructor(private readonly start: TrackPoint, readonly length: number) {}
  pointAt(fraction: number): TrackPoint {
    return { x: this.start.x + fraction * this.length, y: this.start.y };
  }
  strokeOn(surface: PaintSurface): void {
    surface.stroke();
  }
}

export const lineTracks = () => new Map([["e1", new StraightTrackFake({ x: 80, y: 40 }, 120)], ["e2", new StraightTrackFake({ x: 280, y: 40 }, 120)]]);

/** Contexto 2D que só anota o que foi pintado. */
export class RecordingSurfaceFake implements PaintSurface {
  readonly calls: string[] = [];
  fillStyle: string | CanvasGradient | CanvasPattern = "#000";
  strokeStyle: string | CanvasGradient | CanvasPattern = "#000";
  lineWidth = 1;
  lineCap: CanvasLineCap = "butt";
  lineDashOffset = 0;
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = "source-over";
  shadowBlur = 0;
  shadowColor = "transparent";
  private readonly stack: { composite: GlobalCompositeOperation; fill: string | CanvasGradient | CanvasPattern }[] = [];
  save(): void { this.stack.push({ composite: this.globalCompositeOperation, fill: this.fillStyle }); this.calls.push("save"); }
  restore(): void {
    const saved = this.stack.pop();
    if (saved) { this.globalCompositeOperation = saved.composite; this.fillStyle = saved.fill; }
    this.calls.push("restore");
  }
  beginPath(): void {}
  arc(x: number, y: number, radius: number): void { this.calls.push(`arc ${x},${y} r${radius}`); }
  fill(): void { this.calls.push(`fill ${String(this.fillStyle)} ${this.globalCompositeOperation}`); }
  stroke(): void { this.calls.push(`stroke ${String(this.strokeStyle)} offset${this.lineDashOffset}`); }
  setLineDash(segments: Iterable<number>): void { this.calls.push(`dash ${[...segments].join(",")}`); }
  roundRect(x: number, y: number, width: number, height: number): void { this.calls.push(`roundRect ${x},${y} ${width}x${height}`); }
  fillRect(x: number, y: number, width: number, height: number): void { this.calls.push(`fillRect ${x},${y} ${width}x${height}`); }
}
