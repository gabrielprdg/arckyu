import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { createSupabase } from "./supabaseClient";
import { toAuthUser } from "./supabaseAuthGateway";

const userWith = (user_metadata: Record<string, unknown>): User =>
  ({ id: "u1", email: "ana@exemplo.com", user_metadata, app_metadata: {}, aud: "authenticated", created_at: "2026-10-12T00:00:00Z" });

describe("toAuthUser", () => {
  it("usa nome e foto do Google", () =>
    expect(toAuthUser(userWith({ full_name: "Ana Souza", avatar_url: "https://x/ana.png" }))).toEqual({ id: "u1", email: "ana@exemplo.com", name: "Ana Souza", avatarUrl: "https://x/ana.png" }));
  it("GitHub sem nome cai no usuário", () => expect(toAuthUser(userWith({ user_name: "ana-dev" })).name).toBe("ana-dev"));
  it("sem metadados fica nulo", () => expect(toAuthUser(userWith({}))).toMatchObject({ name: null, avatarUrl: null }));
});

describe("createSupabase", () => {
  it("sem .env explica o que falta", () => expect(createSupabase({ url: undefined, publishableKey: undefined }).problem).toContain("VITE_SUPABASE_URL"));
  it("URL sem https é recusada mostrando o valor", () => expect(createSupabase({ url: "meu-projeto", publishableKey: "k" }).problem).toContain('"meu-projeto"'));
});
