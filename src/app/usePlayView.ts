import { useMemo, type MutableRefObject } from "react";
import type { SceneGraph } from "../arch/sceneGraph";
import type { PlayerState } from "../flow/playerReducer";
import { EMPTY_PLAY_SNAPSHOT, playSnapshotAt } from "../flow/playSnapshot";
import type { ScenarioStep } from "../model/types";
import type { Badge, PlayView } from "../overlay/FlowOverlay";

const pad = (order: number): string => String(order).padStart(2, "0");

/** O que a camada desenha no play: passo atual, cards acesos e já visitados. */
export const usePlayView = (graph: SceneGraph, steps: readonly ScenarioStep[], player: PlayerState, progressRef: MutableRefObject<number>): PlayView =>
  useMemo(() => {
    const active = player.status === "playing" || player.status === "paused";
    return { active, progressRef, ...(active ? playSnapshotAt(graph, steps, player.stepIndex) : EMPTY_PLAY_SNAPSHOT) };
  }, [graph, steps, player.status, player.stepIndex, progressRef]);

/** Numeração "01 · 03" dos cards durante a gravação de cenário. */
export const useRecordingBadges = (graph: SceneGraph, order: ReadonlyMap<string, number[]>): Badge[] =>
  useMemo(() => [...order].flatMap(([id, positions]) => {
    const card = graph.cards.get(id);
    return card ? [{ bounds: card.bounds, label: positions.map(pad).join(" · ") }] : [];
  }), [graph, order]);
