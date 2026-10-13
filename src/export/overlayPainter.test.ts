import { describe, expect, it } from "vitest";
import { playSnapshotAt } from "../flow/playSnapshot";
import { lineGraph, lineTracks, RecordingSurfaceFake } from "./__fixtures__/exportScene";
import { paintAmbientFrame, paintPlayFrame } from "./overlayPainter";

const area = { x: -32, y: -32, width: 544, height: 144 };

describe("paintAmbientFrame", () => {
  it("pinta três bolinhas por seta, espaçadas no caminho", () => {
    const surface = new RecordingSurfaceFake();
    paintAmbientFrame(surface, lineGraph().flows, lineTracks(), 0);
    expect(surface.calls.filter((call) => call.startsWith("arc"))).toEqual(["arc 80,40 r4", "arc 120,40 r4", "arc 160,40 r4", "arc 280,40 r4", "arc 320,40 r4", "arc 360,40 r4"]);
  });
  it("traço em movimento usa o mesmo offset da animação CSS", () => {
    const surface = new RecordingSurfaceFake();
    const flows = lineGraph().flows.map((flow) => ({ ...flow, flow: { ...flow.flow, animated: true, packets: false } }));
    paintAmbientFrame(surface, flows, lineTracks(), 0);
    expect(surface.calls).toContain("stroke #fff7ed offset16");
  });
});

describe("paintPlayFrame", () => {
  const steps = [{ edgeId: "e1", reverse: false }, { edgeId: "e2", reverse: true }];
  const paint = (stepIndex: number, progress: number) => {
    const surface = new RecordingSurfaceFake();
    const snapshot = playSnapshotAt(lineGraph(), steps, stepIndex);
    paintPlayFrame(surface, lineGraph().flows, lineTracks(), { snapshot, progress, area, pixelScale: 2 });
    return surface.calls;
  };
  it("esmaece a área toda e fura os cards acesos", () => {
    const calls = paint(0, 0);
    expect([calls[1], calls.filter((call) => call.endsWith("destination-out")).length]).toEqual(["fillRect -32,-32 544x144", 2]);
  });
  it("leva o pacote pelo progresso do passo", () => expect(paint(0, 0.5)).toContain("arc 140,40 r5"));
  it("passo de volta anda do destino para a origem", () => expect(paint(1, 0.25)).toContain("arc 370,40 r5"));
});
