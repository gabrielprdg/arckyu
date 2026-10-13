import { scaleLayout, type DiagramTemplate, type TemplateCard } from "../diagramTemplate";

type CardDetails = { technology: string; description: string };

// Arquitetura FICTÍCIA de exemplo (e-commerce "Loja Nimbus"): serve para demo, prints e landing, sem dado real de cliente.
const DETAILS: Record<string, CardDetails> = {
  web: { technology: "React · SPA no CloudFront", description: "Loja na web: vitrine, carrinho e checkout. Pega o token no Cognito e chama a API." },
  mobile: { technology: "React Native", description: "App da loja: mesmas jornadas da web e recebe push do status do pedido." },
  cognito: { technology: "Amazon Cognito", description: "Login do cliente (e-mail, Google, Apple); emite o JWT que o API Gateway valida." },
  apigw: { technology: "Amazon API Gateway", description: "Entrada única: valida o JWT (authorizer do Cognito), aplica rate limit e recebe o webhook do PSP." },
  orders: { technology: "ECS Fargate · NestJS", description: "orders-service: catálogo, carrinho, checkout e pedidos. Publica pedido.criado no EventBridge." },
  aurora: { technology: "Aurora PostgreSQL", description: "Pedidos, itens, endereços e histórico de status (fonte da verdade do pedido)." },
  dynamo: { technology: "Amazon DynamoDB", description: "Carrinho por cliente e chaves de idempotência do checkout (TTL de 24 h)." },
  cache: { technology: "ElastiCache (Redis)", description: "Catálogo e estoque em cache; invalidado quando o produto muda." },
  payments: { technology: "AWS Lambda", description: "payments-fn: cria a cobrança no PSP, trata o webhook e publica pagamento.aprovado." },
  secrets: { technology: "AWS Secrets Manager", description: "Chave da API do PSP e segredo do webhook, com rotação." },
  bus: { technology: "Amazon EventBridge", description: "Barramento de eventos de domínio: pedido.criado, pagamento.aprovado, pedido.enviado." },
  queue: { technology: "Amazon SQS (+ DLQ)", description: "Fila de fulfillment; mensagem que falha 5 vezes vai para a DLQ." },
  fulfillment: { technology: "AWS Lambda", description: "fulfillment-worker: reserva estoque, cria o envio na transportadora e publica pedido.enviado." },
  notify: { technology: "Amazon SNS", description: "Notificações ao cliente: push no app e e-mail." },
  psp: { technology: "API REST (externo)", description: "Gateway de pagamento: autoriza cartão e Pix e avisa o resultado por webhook." },
  carrier: { technology: "API REST (externo)", description: "Transportadora: cria a etiqueta e devolve o código de rastreio." },
};

const withDetails = (cards: TemplateCard[]): TemplateCard[] => cards.map((card) => ({ ...card, ...DETAILS[card.id] }));

// Nível 2 do C4: containers dentro da fronteira AWS, clientes à esquerda, parceiros à direita.
// Coordenadas na escala original; o export abaixo espaça 1.6× para a fonte grande caber (o card mantém o tamanho; só o espaço entre eles cresce).
const layout: DiagramTemplate = {
  id: "loja-nimbus-c4",
  title: "Loja Nimbus · e-commerce na AWS (exemplo C4)",
  fonts: { cardLabel: 36, caption: 28, arrowLabel: 28, boundary: 36 },
  cardSize: 120,
  arrowStyle: { width: 4, motion: "packets", speed: 70 },
  cards: withDetails([
    { id: "web", iconRef: "tech:react", name: "Loja web", caption: "[SPA React]\nvitrine e checkout", x: -120, y: 140 },
    { id: "mobile", iconRef: "generic:mobile", name: "App mobile", caption: "[React Native]\nrecebe push", x: -120, y: 500 },
    { id: "cognito", iconRef: "aws:cognito", name: "Cognito", caption: "login do cliente\nemite o JWT", x: 70, y: 40 },
    { id: "apigw", iconRef: "aws:api-gateway", name: "API Gateway", caption: "[Container]\nauthorizer JWT\nrate limit", x: 300, y: 320 },
    { id: "orders", iconRef: "aws:fargate", name: "orders-service", caption: "[ECS Fargate · NestJS]\ncatálogo, carrinho\ncheckout e pedidos", x: 600, y: 320 },
    { id: "aurora", iconRef: "aws:aurora", name: "Aurora PostgreSQL", caption: "pedidos e itens\nhistórico de status", x: 600, y: 60 },
    { id: "dynamo", iconRef: "aws:dynamodb", name: "DynamoDB", caption: "carrinho\nidempotência", x: 300, y: 660 },
    { id: "cache", iconRef: "aws:elasticache", name: "ElastiCache", caption: "catálogo\ne estoque", x: 600, y: 660 },
    { id: "bus", iconRef: "aws:eventbridge", name: "EventBridge", caption: "eventos de domínio", x: 900, y: 490 },
    { id: "payments", iconRef: "aws:lambda", name: "payments-fn", caption: "[Lambda]\ncobrança + webhook", x: 1200, y: 320 },
    { id: "secrets", iconRef: "aws:secrets-manager", name: "Secrets Manager", caption: "chave do PSP", x: 1460, y: 100 },
    { id: "queue", iconRef: "aws:sqs", name: "SQS fulfillment", caption: "fila + DLQ", x: 1200, y: 660 },
    { id: "fulfillment", iconRef: "aws:lambda", name: "fulfillment-fn", caption: "[Lambda]\nreserva e envia", x: 1500, y: 660 },
    { id: "notify", iconRef: "aws:sns", name: "SNS", caption: "push e e-mail", x: 900, y: 800 },
    { id: "psp", iconRef: "generic:external-system", name: "PSP", caption: "[Sistema externo]\ncartão e Pix", x: 1760, y: 320 },
    { id: "carrier", iconRef: "generic:external-system", name: "Transportadora", caption: "[Sistema externo]\netiqueta e rastreio", x: 1760, y: 660 },
  ]),
  arrows: [
    { id: "a-web-cognito", from: "web", fromSide: "r", fromOffset: -20, to: "cognito", toSide: "l", label: "login" },
    { id: "a-web-apigw", from: "web", fromSide: "r", fromOffset: 20, to: "apigw", toSide: "l", toOffset: -14, label: "HTTPS + JWT" },
    { id: "a-mobile-apigw", from: "mobile", fromSide: "r", to: "apigw", toSide: "l", toOffset: 14, label: "HTTPS + JWT" },
    { id: "a-apigw-cognito", from: "apigw", fromSide: "t", fromOffset: -40, to: "cognito", toSide: "r", label: "valida JWT" },
    { id: "a-apigw-orders", from: "apigw", fromSide: "r", to: "orders", toSide: "l", label: "/orders · /cart" },
    { id: "a-orders-aurora", from: "orders", fromSide: "t", to: "aurora", toSide: "b", label: "SQL · pedidos" },
    { id: "a-orders-dynamo", from: "orders", fromSide: "b", fromOffset: -30, to: "dynamo", toSide: "t", label: "carrinho + idempotência" },
    { id: "a-orders-cache", from: "orders", fromSide: "b", to: "cache", toSide: "t", label: "cache" },
    { id: "a-orders-bus", from: "orders", fromSide: "b", fromOffset: 30, to: "bus", toSide: "t", toOffset: -20, label: "pedido.criado", kind: "async" },
    { id: "a-orders-payments", from: "orders", fromSide: "r", to: "payments", toSide: "l", label: "invoke · cobrança" },
    { id: "a-payments-secrets", from: "payments", fromSide: "t", fromOffset: 30, to: "secrets", toSide: "l", label: "chave" },
    { id: "a-payments-psp", from: "payments", fromSide: "r", to: "psp", toSide: "l", label: "HTTPS · autoriza" },
    { id: "a-psp-apigw", from: "psp", fromSide: "t", fromOffset: 20, to: "apigw", toSide: "t", toOffset: 40, label: "webhook do pagamento", kind: "callback", detourY: -90 },
    { id: "a-apigw-payments", from: "apigw", fromSide: "t", fromOffset: 16, to: "payments", toSide: "t", label: "/payments/webhook", kind: "callback", detourY: -50 },
    { id: "a-payments-bus", from: "payments", fromSide: "b", to: "bus", toSide: "t", toOffset: 20, label: "pagamento.aprovado", kind: "async" },
    { id: "a-bus-queue", from: "bus", fromSide: "r", fromOffset: 8, to: "queue", toSide: "l", label: "regra: pedido pago", kind: "async" },
    { id: "a-queue-fulfillment", from: "queue", fromSide: "r", to: "fulfillment", toSide: "l", label: "consome", kind: "async" },
    { id: "a-fulfillment-carrier", from: "fulfillment", fromSide: "r", to: "carrier", toSide: "l", label: "cria envio" },
    { id: "a-fulfillment-bus", from: "fulfillment", fromSide: "t", to: "bus", toSide: "r", toOffset: -20, label: "pedido.enviado", kind: "async", via: [[1537.5, 515]] },
    { id: "a-bus-notify", from: "bus", fromSide: "b", to: "notify", toSide: "t", label: "regra: notificar", kind: "async" },
    // Contorna por baixo e entra pela esquerda do app: não cruza cards nem legendas.
    { id: "a-notify-mobile", from: "notify", fromSide: "l", to: "mobile", toSide: "l", label: "push", kind: "async", via: [[-165, 837.5], [-165, 537.5]] },
  ],
  boundaries: [
    { id: "b-aws", name: "Loja Nimbus · AWS (sa-east-1)", x: 60, y: -10, width: 1600, height: 1000 },
    { id: "b-partners", name: "Parceiros (externo)", x: 1720, y: 260, width: 420, height: 640 },
  ],
  texts: [
    { id: "t-title", text: "Loja Nimbus · C4 nível 2 (containers)", x: -120, y: -250, fontSize: 72 },
    { id: "t-subtitle", fontSize: 34, color: "#868e96", x: -120, y: -186, text: "E-commerce fictício de exemplo: checkout, pagamento e entrega, 100% AWS" },
    {
      id: "t-legend", fontSize: 32, x: -120, y: 1030,
      text: "Legenda:  vermelho = síncrono (HTTP/SQL)  ·  laranja = assíncrono (EventBridge/SQS/SNS)  ·  roxo = webhook do PSP  ·  bolinhas = sentido do dado",
    },
    {
      id: "t-notes", fontSize: 30, color: "#495057", x: -120, y: 1066,
      text: [
        "• Checkout idempotente: a Idempotency-Key vai para o DynamoDB antes da cobrança; repetir o POST não cobra duas vezes.",
        "• O pedido nasce \"aguardando pagamento\"; só o webhook do PSP muda para \"pago\".",
        "• EventBridge roteia eventos de domínio; o fulfillment consome pela fila SQS, com DLQ para o que falhar.",
        "• Nenhuma credencial no código: a chave do PSP fica no Secrets Manager.",
      ].join("\n"),
    },
  ],
  // Escritas primeiro, consultas depois; o prefixo aparece na lista de cenários do play.
  scenarios: [
    { name: "1 · Escrita · Checkout (POST /orders)", path: ["web", "apigw", "cognito", "apigw", "orders", "dynamo", "orders", "aurora", "orders", "payments", "secrets", "payments", "psp", "payments", "orders", "apigw", "web"] },
    { name: "2 · Escrita · Pedido criado (evento → push)", path: ["orders", "aurora", "orders", "bus", "notify", "mobile"] },
    { name: "3 · Escrita · Pagamento aprovado (webhook do PSP)", path: ["psp", "apigw", "payments", "bus", "notify", "mobile"] },
    { name: "4 · Escrita · Fulfillment (pedido pago → envio)", path: ["bus", "queue", "fulfillment", "carrier", "fulfillment", "bus", "notify", "mobile"] },
    { name: "5 · Escrita · Carrinho (PUT /cart)", path: ["mobile", "apigw", "cognito", "apigw", "orders", "dynamo", "orders", "apigw", "mobile"] },
    { name: "6 · Consulta · Catálogo (GET /products · cache)", path: ["web", "apigw", "orders", "cache", "orders", "apigw", "web"] },
    { name: "7 · Consulta · Meus pedidos (GET /orders)", path: ["mobile", "apigw", "cognito", "apigw", "orders", "aurora", "orders", "apigw", "mobile"] },
    { name: "8 · Consulta · Status do pagamento (GET /payments/:id)", path: ["web", "apigw", "orders", "payments", "psp", "payments", "orders", "apigw", "web"] },
  ],
};

export const lojaNimbusC4Template: DiagramTemplate = scaleLayout(layout, 1.6);
