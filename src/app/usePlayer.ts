import { useEffect, useReducer, useRef } from "react";
import { PLAY_STEP_MS } from "../flow/flowMath";
import { initialPlayerState, playerReducer } from "../flow/playerReducer";
import { useRafLoop } from "../flow/useRafLoop";
import type { ScenarioStep } from "../model/types";

/** Modo play: estado discreto no reducer, progresso contínuo num ref (sem re-render por frame). */
export const usePlayer = (steps: readonly ScenarioStep[], speed: number) => {
  const totalSteps = steps.length;
  const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
  const progressRef = useRef(0);

  // Recarrega a cada cenário novo (não só quando muda a quantidade de passos).
  useEffect(() => dispatch({ type: "load", totalSteps }), [steps, totalSteps]);
  const isIdle = state.status === "idle";
  // Zera ao trocar de passo ou parar; pausar e retomar mantém o pacote onde estava.
  useEffect(() => { progressRef.current = 0; }, [state.stepIndex, isIdle]);

  useRafLoop((deltaMs) => {
    progressRef.current = Math.min(1, progressRef.current + (deltaMs / PLAY_STEP_MS) * speed);
    if (progressRef.current < 1) return;
    progressRef.current = 0;
    dispatch({ type: "stepFinished" });
  }, state.status === "playing");

  return { state, dispatch, progressRef };
};
