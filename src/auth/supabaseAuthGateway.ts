import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AuthGateway, AuthUser, OAuthProvider } from "./authGateway";

const text = (value: unknown): string | null => (typeof value === "string" && value.trim() !== "" ? value : null);

/**
 * Usuário do Supabase no formato do app; nome e foto vêm do Google/GitHub em user_metadata.
 * @example toAuthUser(session.user).name // "Gabriel"
 */
export const toAuthUser = (user: User): AuthUser => {
  const meta: Record<string, unknown> = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: text(meta.full_name) ?? text(meta.name) ?? text(meta.user_name),
    avatarUrl: text(meta.avatar_url) ?? text(meta.picture),
  };
};

// Depois do retorno do OAuth o supabase-js já trocou o ?code= pela sessão; tira da URL para não vazar em print/histórico.
const stripAuthParams = (): void => {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("code") && !url.searchParams.has("error_description")) return;
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  window.history.replaceState(null, "", url);
};

/** Login pelo Supabase Auth (OAuth Google/GitHub). */
export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly client: SupabaseClient) {}

  async currentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getSession();
    stripAuthParams();
    if (error) throw new Error(`não consegui ler a sessão: ${error.message}`);
    return data.session ? toAuthUser(data.session.user) : null;
  }

  onUserChange(listener: (user: AuthUser | null) => void): () => void {
    const { data } = this.client.auth.onAuthStateChange((_event, session) => listener(session ? toAuthUser(session.user) : null));
    return () => data.subscription.unsubscribe();
  }

  async signInWith(provider: OAuthProvider, redirectTo: string): Promise<void> {
    const { error } = await this.client.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw new Error(`não consegui abrir o login do ${provider}: ${error.message}`);
  }

  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    if (error) throw new Error(`não consegui sair: ${error.message}`);
  }
}
