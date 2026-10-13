export type BoundaryKind = "region" | "vpc" | "cluster" | "environment" | "context";

export const BOUNDARIES: readonly { kind: BoundaryKind; label: string; defaultName: string }[] = [
  { kind: "region", label: "Região", defaultName: "Região us-east-1" },
  { kind: "vpc", label: "VPC", defaultName: "VPC 10.0.0.0/16" },
  { kind: "cluster", label: "Cluster", defaultName: "Cluster k8s" },
  { kind: "environment", label: "Ambiente", defaultName: "Ambiente · prod" },
  { kind: "context", label: "Contexto", defaultName: "Contexto · Pedidos" },
];
