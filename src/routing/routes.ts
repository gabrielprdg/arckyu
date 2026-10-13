/** Páginas do site: landing pública, login, editor (exige conta) e textos legais. */
export type Route = "landing" | "login" | "app" | "terms" | "privacy" | "notFound";

export const PATHS: Record<Exclude<Route, "notFound">, string> = {
  landing: "/",
  login: "/entrar",
  app: "/app",
  terms: "/termos",
  privacy: "/privacidade",
};

const trimSlash = (path: string): string => (path.length > 1 ? path.replace(/\/+$/, "") : path);

/**
 * Página de um caminho (ignora barra no fim).
 * @example routeOf("/app/") // "app"
 */
export const routeOf = (pathname: string): Route => {
  const path = trimSlash(pathname);
  const found = Object.entries(PATHS).find(([, value]) => value === path);
  return found ? routeName(found[0]) : "notFound";
};

const routeName = (name: string): Route => {
  switch (name) {
    case "landing": case "login": case "app": case "terms": case "privacy": return name;
    default: return "notFound";
  }
};

/**
 * Destino depois do login: só caminho interno ("/..."), nunca outro site (evita redirecionamento aberto).
 * @example safeNext("//evil.com") // "/app"
 */
export const safeNext = (next: string | null): string => {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return PATHS.app;
  return next;
};

/** Caminho do login que volta para `next` depois de entrar. @example loginPathFor("/app?modelo=x") // "/entrar?next=%2Fapp%3Fmodelo%3Dx" */
export const loginPathFor = (next: string): string => `${PATHS.login}?next=${encodeURIComponent(next)}`;
