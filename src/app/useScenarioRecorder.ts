import { useCallback, useEffect, useMemo, useState } from "react";
import type { SceneGraph } from "../arch/sceneGraph";
import { buildScenarioSteps } from "../flow/scenario";
import type { Scenario } from "../model/types";

const singleSelectedCard = (graph: SceneGraph, selectedIds: readonly string[]): string | null => {
  const cards = new Set(selectedIds.flatMap((id) => graph.memberToCard.get(id) ?? []));
  return cards.size === 1 ? [...cards][0] : null;
};

/** Grava um cenário selecionando cards em ordem no canvas; saltos são preenchidos pelo menor caminho. */
export const useScenarioRecorder = (graph: SceneGraph, selectedIds: readonly string[], onRecorded: (scenario: Scenario) => void) => {
  const [recording, setRecording] = useState(false);
  const [nodeIds, setNodeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const selectedCard = useMemo(() => singleSelectedCard(graph, selectedIds), [graph, selectedIds]);

  useEffect(() => {
    if (!recording || !selectedCard) return;
    setNodeIds((ids) => (ids[ids.length - 1] === selectedCard ? ids : [...ids, selectedCard]));
  }, [recording, selectedCard]);

  const start = useCallback(() => { setRecording(true); setNodeIds([]); setError(null); }, []);
  const cancel = useCallback(() => { setRecording(false); setNodeIds([]); }, []);

  const finish = useCallback(() => {
    try {
      onRecorded({ name: "Cenário gravado", steps: buildScenarioSteps(nodeIds, graph.edges) });
      cancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [nodeIds, graph.edges, onRecorded, cancel]);

  const order = useMemo(() => {
    const map = new Map<string, number[]>();
    nodeIds.forEach((id, index) => map.set(id, [...(map.get(id) ?? []), index + 1]));
    return map;
  }, [nodeIds]);

  return { recording, clicks: nodeIds.length, order, error, start, cancel, finish };
};
