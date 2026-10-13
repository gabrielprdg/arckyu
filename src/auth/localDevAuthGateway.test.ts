import { describe, expect, it } from "vitest";
import { DEV_USER, LocalDevAuthGateway } from "./localDevAuthGateway";

describe("LocalDevAuthGateway", () => {
  it("já começa logado com o usuário de dev", async () => expect(await new LocalDevAuthGateway().currentUser()).toEqual(DEV_USER));
  it("sair avisa quem escuta e deixa deslogado", async () => {
    const gateway = new LocalDevAuthGateway();
    const seen: (string | null)[] = [];
    gateway.onUserChange((user) => seen.push(user?.id ?? null));
    await gateway.signOut();
    expect([seen, await gateway.currentUser()]).toEqual([[null], null]);
  });
});
