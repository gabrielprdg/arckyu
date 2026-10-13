import { Database, Layers, Network, Server, User, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type DemoCard = { id: string; label: string; caption: string; x: number; y: number; Icon: LucideIcon };
type DemoFlow = { id: string; d: string; kind: "sync" | "async"; seconds: number };

const CARD = 64;

const CARDS: readonly DemoCard[] = [
  { id: "user", label: "Usuário", caption: "navegador", x: 12, y: 84, Icon: User },
  { id: "api", label: "API Gateway", caption: "HTTPS", x: 172, y: 84, Icon: Network },
  { id: "fn", label: "Serviço", caption: "NestJS", x: 324, y: 84, Icon: Server },
  { id: "db", label: "Banco", caption: "Postgres", x: 476, y: 20, Icon: Database },
  { id: "queue", label: "Fila", caption: "SQS", x: 476, y: 158, Icon: Layers },
];

const FLOWS: readonly DemoFlow[] = [
  { id: "f1", d: "M76 116 L172 116", kind: "sync", seconds: 1.5 },
  { id: "f2", d: "M236 116 L324 116", kind: "sync", seconds: 1.5 },
  { id: "f3", d: "M388 104 C432 104 432 52 476 52", kind: "sync", seconds: 1.7 },
  { id: "f4", d: "M388 128 C432 128 432 190 476 190", kind: "async", seconds: 2.3 },
];

// Caminho do play: usuário → API → serviço → banco; o pacote "salta" os cards (os M do path).
const PLAY_PATH = "M76 116 L172 116 M236 116 L324 116 M388 104 C432 104 432 52 476 52";

// Sem animação para quem pediu menos movimento no sistema; a seta ativa continua desenhada.
const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
};

const CardShape = ({ card }: { card: DemoCard }) => (
  <g transform={`translate(${card.x} ${card.y})`}>
    <rect width={CARD} height={CARD} rx={12} style={{ fill: "var(--surface-raised)", stroke: "var(--ink)" }} strokeWidth={2} />
    <card.Icon x={20} y={20} width={24} height={24} style={{ color: "var(--ink)" }} strokeWidth={1.9} />
    <text x={CARD / 2} y={CARD + 18} textAnchor="middle" className="demo__label">{card.label}</text>
    <text x={CARD / 2} y={CARD + 33} textAnchor="middle" className="demo__caption">{card.caption}</text>
  </g>
);

const FlowPath = ({ flow, animate }: { flow: DemoFlow; animate: boolean }) => {
  const color = flow.kind === "sync" ? "var(--flow-sync)" : "var(--flow-async)";
  return (
    <g>
      <path d={flow.d} fill="none" style={{ stroke: color }} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={flow.kind === "async" ? "7 6" : undefined} />
      {animate && [0, 1, 2].map((index) => (
        <circle key={index} r={4.5} style={{ fill: color }}>
          <animateMotion dur={`${flow.seconds}s`} begin={`${-(index * flow.seconds) / 3}s`} repeatCount="indefinite" path={flow.d} />
        </circle>
      ))}
    </g>
  );
};

/** Demonstração do hero: mini arquitetura com bolinhas nas setas e o pacote verde do play percorrendo o caminho. */
export const LandingDemo = () => {
  const animate = !usePrefersReducedMotion();
  return (
    <svg className="demo" viewBox="0 0 560 272" role="img" aria-label="Diagrama animado: usuário, API Gateway, serviço, banco e fila, com dados fluindo pelas setas">
      <rect x={150} y={4} width={404} height={264} rx={18} fill="none" style={{ stroke: "var(--stone)" }} strokeWidth={1.5} strokeDasharray="8 6" />
      <text x={164} y={24} className="demo__boundary">Nuvem · produção</text>
      {FLOWS.map((flow) => <FlowPath key={flow.id} flow={flow} animate={animate} />)}
      {CARDS.map((card) => <CardShape key={card.id} card={card} />)}
      {animate && (
        <g style={{ fill: "var(--play)" }}>
          <circle r={10} opacity={0.25} />
          <circle r={5} />
          <animateMotion dur="3.6s" repeatCount="indefinite" path={PLAY_PATH} />
        </g>
      )}
    </svg>
  );
};
