import type { AuthGateway, AuthUser } from "./authGateway";

/** Usuário fictício do modo local (sem Supabase). */
export const DEV_USER: AuthUser = { id: "dev-local", email: "dev@localhost", name: "Dev local", avatarUrl: null };

/**
 * Login de mentira para desenvolver sem Supabase: já começa logado; "Sair" e "Entrar" só trocam o estado na aba.
 * Montado só quando import.meta.env.DEV e VITE_DEV_SKIP_AUTH=true (ver main.tsx).
 * @example const gateway = new LocalDevAuthGateway(); await gateway.currentUser() // DEV_USER
 */
export class LocalDevAuthGateway implements AuthGateway {
  private user: AuthUser | null = DEV_USER;
  private readonly listeners = new Set<(user: AuthUser | null) => void>();

  async currentUser(): Promise<AuthUser | null> {
    return this.user;
  }

  onUserChange(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async signInWith(_provider: "google" | "github", redirectTo: string): Promise<void> {
    this.emit(DEV_USER);
    // Sem provedor de verdade: vai direto para o destino, como o retorno do OAuth faria.
    const target = new URL(redirectTo);
    window.history.pushState(null, "", `${target.pathname}${target.search}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  async signOut(): Promise<void> {
    this.emit(null);
  }

  private emit(user: AuthUser | null): void {
    this.user = user;
    this.listeners.forEach((listener) => listener(user));
  }
}
