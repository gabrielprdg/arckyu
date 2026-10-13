import type { IconCategory } from "../model/types";
import type { IconSource } from "./iconSource";

export type IconDefinition = {
  ref: string;
  name: string;
  category: IconCategory;
  aliases: string[];
  source: IconSource;
};

const LUCIDE: IconSource = { kind: "lucide" };
const logo = (id: string): IconSource => ({ kind: "iconify", id });

// Genéricos usam glifo (lucide, ISC); tecnologias e AWS usam logos reais via Iconify (Logos, CC0).
// Logos são marcas registradas: uso nominativo, sem alterar.
export const ICON_CATALOG: readonly IconDefinition[] = [
  { ref: "generic:user", name: "Usuário", category: "client", aliases: ["cliente", "client", "pessoa"], source: LUCIDE },
  { ref: "generic:browser", name: "Browser", category: "client", aliases: ["web", "spa", "frontend"], source: LUCIDE },
  { ref: "generic:mobile", name: "Mobile", category: "client", aliases: ["app", "celular", "ios", "android"], source: LUCIDE },
  { ref: "tech:react", name: "React", category: "client", aliases: ["frontend", "spa", "next"], source: logo("logos:react") },
  { ref: "tech:sap", name: "SAP", category: "client", aliases: ["erp", "s4", "s/4hana", "abap"], source: logo("logos:sap") },
  { ref: "generic:external-system", name: "Sistema externo", category: "network", aliases: ["parceiro", "terceiro", "provedor", "api externa"], source: LUCIDE },
  { ref: "aws:route53", name: "Route 53", category: "network", aliases: ["dns", "domínio", "aws"], source: logo("logos:aws-route53") },
  { ref: "aws:cloudfront", name: "CloudFront", category: "network", aliases: ["cdn", "edge", "aws"], source: logo("logos:aws-cloudfront") },
  { ref: "aws:api-gateway", name: "API Gateway", category: "network", aliases: ["gateway", "apigw", "bff", "aws"], source: logo("logos:aws-api-gateway") },
  { ref: "aws:elb", name: "Load Balancer", category: "network", aliases: ["lb", "alb", "nlb", "elb", "aws"], source: logo("logos:aws-elb") },
  { ref: "tech:nginx", name: "Nginx", category: "network", aliases: ["proxy", "reverse proxy", "ingress"], source: logo("logos:nginx") },
  { ref: "generic:dns", name: "DNS", category: "network", aliases: ["domínio"], source: LUCIDE },
  { ref: "generic:cdn", name: "CDN", category: "network", aliases: ["edge", "cache de borda"], source: LUCIDE },
  { ref: "aws:waf", name: "WAF", category: "security", aliases: ["firewall", "aws"], source: logo("logos:aws-waf") },
  { ref: "aws:ssm", name: "AWS SSM", category: "security", aliases: ["parameter store", "secrets", "segredo", "aws"], source: logo("logos:aws-systems-manager") },
  { ref: "aws:cognito", name: "Cognito", category: "security", aliases: ["login", "auth", "jwt", "identidade", "aws"], source: logo("logos:aws-cognito") },
  { ref: "aws:secrets-manager", name: "Secrets Manager", category: "security", aliases: ["segredo", "secrets", "chave", "aws"], source: logo("logos:aws-secrets-manager") },
  { ref: "generic:registry", name: "Registradora", category: "storage", aliases: ["b3", "csd", "cerc", "registro"], source: LUCIDE },
  { ref: "generic:firewall", name: "Firewall", category: "security", aliases: ["security group"], source: LUCIDE },
  { ref: "aws:lambda", name: "Lambda", category: "compute", aliases: ["function", "faas", "serverless", "aws"], source: logo("logos:aws-lambda") },
  { ref: "aws:fargate", name: "ECS Fargate", category: "compute", aliases: ["ecs", "container", "serviço", "aws"], source: logo("logos:aws-fargate") },
  { ref: "generic:server", name: "Servidor", category: "compute", aliases: ["server", "vm", "ec2", "backend"], source: LUCIDE },
  { ref: "generic:worker", name: "Worker", category: "compute", aliases: ["job", "consumer", "batch"], source: LUCIDE },
  { ref: "tech:nestjs", name: "NestJS", category: "compute", aliases: ["node", "api", "backend", "nest"], source: logo("logos:nestjs") },
  { ref: "generic:cron", name: "Cron", category: "compute", aliases: ["agendador", "schedule", "job agendado"], source: logo("fluent-color:clock-24") },
  { ref: "generic:scaledjob", name: "ScaledJob (KEDA)", category: "container", aliases: ["keda", "job", "consumer", "worker", "k8s"], source: logo("logos:kubernetes") },
  { ref: "aws:aurora", name: "Aurora", category: "database", aliases: ["rds", "sql", "aws"], source: logo("logos:aws-aurora") },
  { ref: "aws:dynamodb", name: "DynamoDB", category: "database", aliases: ["dynamo", "nosql", "chave-valor", "aws"], source: logo("logos:aws-dynamodb") },
  { ref: "aws:elasticache", name: "ElastiCache", category: "database", aliases: ["cache", "redis", "valkey", "aws"], source: logo("logos:aws-elasticache") },
  { ref: "tech:postgresql", name: "PostgreSQL", category: "database", aliases: ["postgres", "pg", "sql"], source: logo("logos:postgresql") },
  { ref: "tech:mysql", name: "MySQL", category: "database", aliases: ["mariadb", "sql"], source: logo("logos:mysql-icon") },
  { ref: "tech:mongodb", name: "MongoDB", category: "database", aliases: ["mongo", "nosql", "documentdb"], source: logo("logos:mongodb-icon") },
  { ref: "tech:redis", name: "Redis", category: "database", aliases: ["cache", "elasticache", "valkey"], source: logo("logos:redis") },
  { ref: "tech:elasticsearch", name: "Elasticsearch", category: "database", aliases: ["elastic", "opensearch", "busca"], source: logo("logos:elasticsearch") },
  { ref: "tech:supabase", name: "Supabase", category: "database", aliases: ["postgres", "baas"], source: logo("logos:supabase-icon") },
  { ref: "tech:rabbitmq", name: "RabbitMQ", category: "messaging", aliases: ["amqp", "fila", "queue", "broker"], source: logo("logos:rabbitmq-icon") },
  { ref: "tech:kafka", name: "Kafka", category: "messaging", aliases: ["stream", "msk", "eventos", "topic"], source: logo("logos:kafka-icon") },
  { ref: "aws:sqs", name: "SQS", category: "messaging", aliases: ["fila", "queue", "sns", "aws"], source: logo("logos:aws-sqs") },
  { ref: "aws:sns", name: "SNS", category: "messaging", aliases: ["notificação", "push", "pub/sub", "tópico", "aws"], source: logo("logos:aws-sns") },
  { ref: "aws:eventbridge", name: "EventBridge", category: "messaging", aliases: ["eventos", "event bus", "barramento", "aws"], source: logo("logos:aws-eventbridge") },
  { ref: "tech:redis-streams", name: "Redis Streams", category: "messaging", aliases: ["stream", "eventos"], source: logo("logos:redis") },
  { ref: "aws:s3", name: "S3", category: "storage", aliases: ["blob", "bucket", "arquivos", "aws"], source: logo("logos:aws-s3") },
  { ref: "generic:storage", name: "Storage", category: "storage", aliases: ["blob", "disco"], source: LUCIDE },
  { ref: "tech:docker", name: "Docker", category: "container", aliases: ["container", "imagem"], source: logo("logos:docker-icon") },
  { ref: "tech:kubernetes", name: "Kubernetes", category: "container", aliases: ["k8s", "eks", "aks", "gke", "cluster"], source: logo("logos:kubernetes") },
];

export const findIcon = (catalog: readonly IconDefinition[], ref: string): IconDefinition | undefined =>
  catalog.find((icon) => icon.ref === ref);
