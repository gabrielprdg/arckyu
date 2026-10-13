import type { MutableRefObject } from "react";
import type { Bounds, FlowArrow } from "../arch/sceneGraph";
import type { PlaySnapshot } from "../flow/playSnapshot";
import { MarchingAnts } from "./MarchingAnts";
import { DARK_THEME_FILTER } from "./overlayStyle";
import { PacketDots } from "./PacketDots";
import { RequestPacket } from "./RequestPacket";

export type Viewport = { scrollX: number; scrollY: number; zoom: number };

export type PlayView = PlaySnapshot & { active: boolean; progressRef: MutableRefObject<number> };

export type Badge = { bounds: Bounds; label: string };

type FlowOverlayProps = { flows: FlowArrow[]; viewport: Viewport; dark: boolean; paused: boolean; play: PlayView; badges: Badge[] };

// Numeração dos cards durante a gravação, no estilo dos slots "01", "02" do Cloudling.
const BadgeView = ({ badge }: { badge: Badge }) => {
  const width = 10 + badge.label.length * 7;
  const x = badge.bounds.x + badge.bounds.width - width / 2;
  return (
    <g className="order-badge" transform={`translate(${x} ${badge.bounds.y - 10})`}>
      <rect width={width} height={18} rx={4} />
      <text x={width / 2} y={13} textAnchor="middle">{badge.label}</text>
    </g>
  );
};

const CardGlow = ({ bounds, className }: { bounds: Bounds; className: string }) => (
  <rect x={bounds.x - 8} y={bounds.y - 8} width={bounds.width + 16} height={bounds.height + 16} rx={16} className={className} />
);

const AmbientFlow = ({ flow, paused }: { flow: FlowArrow; paused: boolean }) => (
  <g>
    {flow.flow.animated && <MarchingAnts path={flow.path} flow={flow.flow} communication={flow.communication} />}
    {flow.flow.packets && <PacketDots path={flow.path} flow={flow.flow} paused={paused} />}
  </g>
);

const PlayLayer = ({ flows, play }: { flows: FlowArrow[]; play: PlayView }) => {
  const activeFlow = play.step ? flows.find((flow) => flow.id === play.step?.edgeId) : undefined;
  return (
    <g>
      <defs>
        <mask id="play-spotlight-mask" maskUnits="userSpaceOnUse">
          <rect x={-1e5} y={-1e5} width={2e5} height={2e5} fill="white" />
          {play.litAreas.map((b, i) => <rect key={i} x={b.x - 10} y={b.y - 10} width={b.width + 20} height={b.height + 20} rx={16} fill="black" />)}
        </mask>
      </defs>
      <rect x={-1e5} y={-1e5} width={2e5} height={2e5} className="play-spotlight" mask="url(#play-spotlight-mask)" />
      {play.visitedCards.map((bounds, i) => <CardGlow key={`v${i}`} bounds={bounds} className="glow glow--visited" />)}
      {play.activeCards.map((bounds, i) => <CardGlow key={`a${i}`} bounds={bounds} className="glow glow--active" />)}
      {activeFlow && play.step && (
        <>
          <path d={activeFlow.path} className="play-path" strokeWidth={activeFlow.flow.width + 2} />
          <RequestPacket path={activeFlow.path} reverse={play.step.reverse} progressRef={play.progressRef} />
        </>
      )}
    </g>
  );
};

/** SVG transparente sobre o canvas do Excalidraw, em coordenadas de cena (mesmo scroll/zoom). */
export const FlowOverlay = ({ flows, viewport, dark, paused, play, badges }: FlowOverlayProps) => (
  <svg className={`flow-overlay${paused ? " flow-paused" : ""}`} style={{ filter: dark ? DARK_THEME_FILTER : undefined }} aria-hidden>
    <g transform={`scale(${viewport.zoom}) translate(${viewport.scrollX} ${viewport.scrollY})`}>
      {!play.active && flows.map((flow) => <AmbientFlow key={flow.id} flow={flow} paused={paused} />)}
      {play.active && <PlayLayer flows={flows} play={play} />}
      {badges.map((badge, i) => <BadgeView key={i} badge={badge} />)}
    </g>
  </svg>
);
