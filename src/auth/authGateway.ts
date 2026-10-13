/** Quem está logado, no formato que o app usa (independente do provedor de auth). */
export type AuthUser = { id: string; email: string | null; name: string | null; avatarUrl: string | null };

export type OAuthProvider = "google" | "github";

/** Interface do login; hoje implementada pelo Supabase. Facilita fake nos testes e troca de provedor. */
export interface AuthGateway {
  currentUser(): Promise<AuthUser | null>;
  /** Avisa a cada login/logout/renovação; devolve a função que para de escutar. */
  onUserChange(listener: (user: AuthUser | null) => void): () => void;
  /** Leva para a tela do provedor; volta em `redirectTo` já logado. */
  signInWith(provider: OAuthProvider, redirectTo: string): Promise<void>;
  signOut(): Promise<void>;
}
