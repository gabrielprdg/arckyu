import { useEffect, useState } from "react";
import { searchIconify } from "../icons/iconifyClient";

export type IconSearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; results: string[] }
  | { status: "error"; message: string };

const DEBOUNCE_MS = 350;

/** Busca no Iconify enquanto o usuário digita (debounce + cancela a busca anterior). */
export const useIconSearch = (query: string): IconSearchState => {
  const [state, setState] = useState<IconSearchState>({ status: "idle" });

  useEffect(() => {
    if (query.trim().length < 2) {
      setState({ status: "idle" });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState({ status: "loading" });
      try {
        const results = await searchIconify(query, { fetchFn: (url, init) => fetch(url, init), signal: controller.signal });
        setState({ status: "done", results });
      } catch (err) {
        if (!controller.signal.aborted) setState({ status: "error", message: err instanceof Error ? err.message : String(err) });
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return state;
};
