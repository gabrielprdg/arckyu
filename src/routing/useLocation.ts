import { useCallback, useEffect, useState } from "react";

export type AppLocation = { pathname: string; search: string };

const current = (): AppLocation => ({ pathname: window.location.pathname, search: window.location.search });

/** Caminho atual + navegação pelo History API (sem recarregar a página). */
export const useLocation = () => {
  const [location, setLocation] = useState<AppLocation>(current);
  useEffect(() => {
    const onPop = () => setLocation(current());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const navigate = useCallback((to: string, options: { replace?: boolean } = {}) => {
    if (options.replace) window.history.replaceState(null, "", to);
    else window.history.pushState(null, "", to);
    setLocation(current());
    window.scrollTo(0, 0);
  }, []);
  return { location, navigate };
};

export type Navigate = ReturnType<typeof useLocation>["navigate"];
