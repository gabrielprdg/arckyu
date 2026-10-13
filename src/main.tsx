import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/700.css";
import { App, type AppServices } from "./App";
import { LocalDevAuthGateway } from "./auth/localDevAuthGateway";
import { SupabaseAuthGateway } from "./auth/supabaseAuthGateway";
import { createSupabase } from "./auth/supabaseClient";
import { IndexedDbDrawingStore } from "./drawings/indexedDbDrawingStore";
import { LazyDrawingStore } from "./drawings/lazyDrawingStore";
import { SupabaseDrawingStore } from "./drawings/supabaseDrawingStore";

const root = document.getElementById("root");
if (!root) throw new Error("elemento #root não encontrado em index.html");

// Atalho de desenvolvimento: sem login e sem nuvem. import.meta.env.DEV é false no build, então nunca vale em produção.
const skipAuth = import.meta.env.DEV && import.meta.env.VITE_DEV_SKIP_AUTH === "true";

// Raiz de composição: único lugar que conhece o Supabase; o resto do app recebe interfaces.
const createServices = (): AppServices => {
  if (skipAuth) {
    console.warn(JSON.stringify({ event: "dev_skip_auth", note: "login desligado (VITE_DEV_SKIP_AUTH); desenhos no IndexedDB deste navegador" }));
    return { gateway: new LocalDevAuthGateway(), store: new LazyDrawingStore(() => IndexedDbDrawingStore.open()), setupProblem: null };
  }
  const supabase = createSupabase({ url: import.meta.env.VITE_SUPABASE_URL, publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY });
  return supabase.client
    ? { gateway: new SupabaseAuthGateway(supabase.client), store: new SupabaseDrawingStore(supabase.client), setupProblem: null }
    : { gateway: null, store: null, setupProblem: supabase.problem };
};

createRoot(root).render(
  <StrictMode>
    <App services={createServices()} />
  </StrictMode>,
);
