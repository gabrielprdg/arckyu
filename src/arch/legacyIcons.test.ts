import { describe, expect, it } from "vitest";
import { planLegacyIconMigration } from "./legacyIcons";

const image = (fileId: string, isDeleted = false) => ({ type: "image", isDeleted, fileId });

describe("planLegacyIconMigration", () => {
  it("migra SVG original (sem versão) para a atual", () =>
    expect([...planLegacyIconMigration([image("archflow-icon-tech-redis")])]).toEqual([["archflow-icon-tech-redis", "archflow-icon-v3-tech-redis"]]));
  it("migra v2 para v3 sem acumular prefixo", () =>
    expect(planLegacyIconMigration([image("archflow-icon-v2-tech-kafka")]).get("archflow-icon-v2-tech-kafka")).toBe("archflow-icon-v3-tech-kafka"));
  it("ignora versão atual, imagens do usuário e apagados", () =>
    expect(planLegacyIconMigration([image("archflow-icon-v3-tech-redis"), image("foto-123"), image("archflow-icon-x", true)]).size).toBe(0));
  it("deduplica o mesmo ícone em vários cards", () =>
    expect(planLegacyIconMigration([image("archflow-icon-aws-sqs"), image("archflow-icon-aws-sqs")]).size).toBe(1));
});
