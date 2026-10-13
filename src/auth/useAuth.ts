import { useEffect, useState } from "react";
import type { AuthGateway, AuthUser } from "./authGateway";

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut"; problem: string | null }
  | { status: "signedIn"; user: AuthUser };

/** Estado do login, atualizado a cada mudança de sessão. Sem gateway (não configurado) = deslogado com o motivo. */
export const useAuth = (gateway: AuthGateway | null, setupProblem: string | null): AuthState => {
  const [state, setState] = useState<AuthState>(gateway ? { status: "loading" } : { status: "signedOut", problem: setupProblem });
  useEffect(() => {
    if (!gateway) return;
    let alive = true;
    const apply = (user: AuthUser | null) => { if (alive) setState(user ? { status: "signedIn", user } : { status: "signedOut", problem: null }); };
    gateway.currentUser().then(apply).catch((error: unknown) => {
      if (alive) setState({ status: "signedOut", problem: error instanceof Error ? error.message : String(error) });
    });
    const stop = gateway.onUserChange(apply);
    return () => { alive = false; stop(); };
  }, [gateway]);
  return state;
};
