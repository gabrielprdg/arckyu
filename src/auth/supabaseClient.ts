import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnv = { url: string | undefined; publishableKey: string | undefined };

/** Configuração faltando vira mensagem na tela (dev sem .env.local), não tela branca. */
export type SupabaseSetup = { client: SupabaseClient; problem: null } | { client: null; problem: string };

/**
 * Cria o cliente do Supabase a partir do .env.local; PKCE porque o retorno do OAuth vem por código na URL.
 * @example const setup = createSupabase({ url: import.meta.env.VITE_SUPABASE_URL, publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY })
 */
export const createSupabase = (env: SupabaseEnv): SupabaseSetup => {
  if (!env.url || !env.publishableKey) {
    return { client: null, problem: "Login não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local (veja .env.example)." };
  }
  if (!/^https?:\/\//.test(env.url)) return { client: null, problem: `VITE_SUPABASE_URL inválida: "${env.url}" (esperado https://SEU-REF.supabase.co)` };
  const client = createClient(env.url, env.publishableKey, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return { client, problem: null };
};
