import { describe, expect, it } from "vitest";
import { lineGraph } from "../export/__fixtures__/exportScene";
import { EMPTY_PLAY_SNAPSHOT, playSnapshotAt } from "./playSnapshot";

const steps = [{ edgeId: "e1", reverse: false }, { edgeId: "e2", reverse: false }];
const xs = (bounds: { x: number }[]) => bounds.map((b) => b.x);

describe("playSnapshotAt", () => {
  it("no primeiro passo acende origem e destino", () => {
    const snapshot = playSnapshotAt(lineGraph(), steps, 0);
    expect([xs(snapshot.activeCards), xs(snapshot.visitedCards)]).toEqual([[0, 200], []]);
  });
  it("cards dos passos anteriores ficam como visitados e continuam acesos", () => {
    const snapshot = playSnapshotAt(lineGraph(), steps, 1);
    expect([xs(snapshot.visitedCards), xs(snapshot.litAreas)]).toEqual([[0, 200], [0, 200, 400]]);
  });
  it("passo além do fim fica no último", () => expect(playSnapshotAt(lineGraph(), steps, 9).step?.edgeId).toBe("e2"));
  it("sem passos não acende nada", () => expect(playSnapshotAt(lineGraph(), [], 0)).toBe(EMPTY_PLAY_SNAPSHOT));
});
