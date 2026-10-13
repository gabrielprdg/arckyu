import { useCallback, useEffect, useRef, useState } from "react";

export type ThemeName = "light" | "dark";

const STORAGE_KEY = "archflow:theme";

const loadTheme = (): ThemeName => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

/** Tema único para o app e o Excalidraw; aceita a troca feita pelo menu do próprio Excalidraw. */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(loadTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // sem storage: só não lembra na próxima visita
    }
  }, [theme]);

  const toggle = useCallback(() => setTheme((current) => (current === "dark" ? "light" : "dark")), []);

  // Só adota o tema do canvas quando ELE mudou (troca pelo menu do Excalidraw). Comparar com o nosso
  // estado entra em loop: logo após o toggle, o onChange ainda chega com o tema antigo.
  const lastCanvasThemeRef = useRef<string | null>(null);
  const syncFromCanvas = useCallback((canvasTheme: string) => {
    const previous = lastCanvasThemeRef.current;
    lastCanvasThemeRef.current = canvasTheme;
    if (previous === null || previous === canvasTheme) return;
    if (canvasTheme === "dark" || canvasTheme === "light") setTheme(canvasTheme);
  }, []);

  return { theme, toggle, syncFromCanvas };
};

export type ThemeControls = ReturnType<typeof useTheme>;
