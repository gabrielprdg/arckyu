import { lazy, Suspense, useCallback, useEffect } from "react";
import type { AuthGateway } from "./auth/authGateway";
import { useAuth, type AuthState } from "./auth/useAuth";
import type { DrawingStore } from "./drawings/drawingTypes";
import { LandingPage } from "./landing/LandingPage";
import { LegalPage } from "./landing/LegalPage";
import { LoginPage } from "./landing/LoginPage";
import { NavigateContext } from "./routing/Link";
import { loginPathFor, PATHS, routeOf, safeNext } from "./routing/routes";
import { useLocation, type Navigate } from "./routing/useLocation";
import "./styles.css";

// O editor (Excalidraw) é pesado: só baixa quando a pessoa entra no app, a landing abre leve.
const EditorApp = lazy(() => import("./EditorApp").then((module) => ({ default: module.EditorApp })));

/** Serviços externos montados em main.tsx (injetados para dar para trocar/fakear). */
export type AppServices = { gateway: AuthGateway | null; store: DrawingStore | null; setupProblem: string | null };

const Loading = ({ text }: { text: string }) => <div className="app-loading">{text}</div>;

const Redirect = ({ to, navigate }: { to: string; navigate: Navigate }) => {
  useEffect(() => navigate(to, { replace: true }), [to, navigate]);
  return <Loading text="Redirecionando…" />;
};

const ProtectedApp = ({ auth, services, navigate, here }: { auth: AuthState; services: AppServices; navigate: Navigate; here: string }) => {
  const signOut = useCallback(() => {
    void services.gateway?.signOut().finally(() => navigate(PATHS.landing));
  }, [services.gateway, navigate]);
  if (auth.status === "loading") return <Loading text="Entrando…" />;
  if (auth.status === "signedOut" || !services.store) return <Redirect to={loginPathFor(here)} navigate={navigate} />;
  return (
    <Suspense fallback={<Loading text="Abrindo o editor…" />}>
      <EditorApp key={auth.user.id} store={services.store} user={auth.user} onSignOut={signOut} />
    </Suspense>
  );
};

/** Site inteiro: landing pública, login (Google/GitHub), editor protegido e páginas legais. */
export const App = ({ services }: { services: AppServices }) => {
  const { location, navigate } = useLocation();
  const auth = useAuth(services.gateway, services.setupProblem);
  const route = routeOf(location.pathname);
  const next = safeNext(new URLSearchParams(location.search).get("next"));

  const page = (() => {
    switch (route) {
      case "landing": return <LandingPage signedIn={auth.status === "signedIn"} />;
      case "login":
        if (auth.status === "signedIn") return <Redirect to={next} navigate={navigate} />;
        return <LoginPage gateway={services.gateway} problem={auth.status === "signedOut" ? auth.problem : null} next={next} />;
      case "app": return <ProtectedApp auth={auth} services={services} navigate={navigate} here={`${location.pathname}${location.search}`} />;
      case "terms": return <LegalPage kind="terms" />;
      case "privacy": return <LegalPage kind="privacy" />;
      case "notFound": return <LegalPage kind="notFound" />;
    }
  })();
  return <NavigateContext.Provider value={navigate}>{page}</NavigateContext.Provider>;
};
