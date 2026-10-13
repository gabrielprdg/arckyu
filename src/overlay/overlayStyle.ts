// Mesmo filtro que o Excalidraw aplica ao canvas no tema escuro; sem ele as cores da camada não batem.
export const DARK_THEME_FILTER = "invert(93%) hue-rotate(180deg)";

/** Cores do play fora do CSS: o export (canvas e SVG solto) não enxerga as classes do app. */
export const PLAY_STYLE = {
  ok: "#2f9e44",
  visited: "#8ce99a",
  spotlight: "rgba(255, 255, 255, .72)",
  packetHalo: "#2f9e4433",
  litPadding: 10,
  glowPadding: 8,
  haloRadius: 11,
  coreRadius: 5,
} as const;
