import { useEffect } from "react";

/** Alt+P alterna a pausa global (P sozinho é a caneta do Excalidraw). */
export const useAltPShortcut = (toggle: () => void): void => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && event.code === "KeyP") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
};
