import type { DiagramTemplate } from "../diagramTemplate";

export const serverlessTemplate: DiagramTemplate = {
  id: "serverless",
  title: "Exemplo · serverless na AWS",
  cards: [
    { id: "user", iconRef: "generic:user", name: "Usuário", x: 0, y: 200 },
    { id: "dns", iconRef: "aws:route53", name: "Route 53", x: 180, y: 20 },
    { id: "cdn", iconRef: "aws:cloudfront", name: "CloudFront", x: 200, y: 200 },
    { id: "api", iconRef: "aws:api-gateway", name: "API Gateway", x: 440, y: 200 },
    { id: "fn", iconRef: "aws:lambda", name: "Lambda", x: 660, y: 200 },
    { id: "db", iconRef: "aws:aurora", name: "Aurora", x: 880, y: 200 },
    { id: "queue", iconRef: "aws:sqs", name: "SQS", x: 660, y: 400 },
    { id: "worker", iconRef: "generic:worker", name: "Worker", x: 880, y: 400 },
  ],
  arrows: [
    { id: "a-user-dns", from: "user", fromSide: "t", to: "dns", toSide: "l", label: "DNS" },
    { id: "a-user-cdn", from: "user", fromSide: "r", to: "cdn", toSide: "l", label: "HTTPS" },
    { id: "a-cdn-api", from: "cdn", fromSide: "r", to: "api", toSide: "l", label: "HTTPS" },
    { id: "a-api-fn", from: "api", fromSide: "r", to: "fn", toSide: "l", label: "invoke" },
    { id: "a-fn-db", from: "fn", fromSide: "r", to: "db", toSide: "l", label: "SQL" },
    { id: "a-fn-queue", from: "fn", fromSide: "b", to: "queue", toSide: "t", label: "SQS", kind: "async" },
    { id: "a-queue-worker", from: "queue", fromSide: "r", to: "worker", toSide: "l", label: "poll", kind: "async", packets: true },
  ],
  boundaries: [{ id: "vpc", name: "Região us-east-1 · VPC prod", x: 400, y: 150, width: 620, height: 400 }],
  texts: [],
  scenarios: [{ name: "Requisição GET /pedidos", path: ["user", "dns", "user", "cdn", "api", "fn", "db", "fn", "api", "cdn", "user"] }],
};
