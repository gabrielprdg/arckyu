import { useEffect, useRef } from "react";

/** Chama `onFrame(deltaMs)` a cada frame enquanto `active`; o callback mais recente é sempre usado. */
export const useRafLoop = (onFrame: (deltaMs: number) => void, active: boolean): void => {
  const callbackRef = useRef(onFrame);
  callbackRef.current = onFrame;

  useEffect(() => {
    if (!active) return;
    let frameId = 0;
    let last = performance.now();
    const tick = (now: number): void => {
      callbackRef.current(now - last);
      last = now;
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active]);
};
