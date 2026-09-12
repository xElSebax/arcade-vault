import type { GameSkinId } from "@/lib/games/skins/types";

/** Piece color palette indexed 1–8; index 0 unused. */
export type TetrisPieceColors = readonly (string | null)[];

export interface TetrisSkinTokens {
  /** `null` = transparent canvas (CSS background shows through). */
  background: string | null;
  grid: string;
  colors: TetrisPieceColors;
  ghostAlpha: number;
  blockHighlight: string;
  /** Dark edge for retro phosphor depth (no glow). */
  blockShadow?: string;
  /** Outer ring on neon blocks. */
  blockStroke?: string;
  glowBlur?: number;
  gridLineWidth?: number;
}

const CLASSIC_COLORS: TetrisPieceColors = [
  null,
  "#4dd0e1", // I — cyan
  "#ffd54f", // O — yellow
  "#ba68c8", // T — purple
  "#81c784", // S — green
  "#e57373", // Z — red
  "#90caf9", // J — pale blue
  "#ffb74d", // L — orange
  "#9e9e9e", // N — tuerca (gris metálico)
];

export const TETRIS_SKINS: Record<GameSkinId, TetrisSkinTokens> = {
  classic: {
    background: null,
    grid: "#22222e",
    colors: CLASSIC_COLORS,
    ghostAlpha: 0.2,
    blockHighlight: "rgba(255,255,255,0.12)",
  },
  retro: {
    background: "#050508",
    grid: "rgba(51, 255, 102, 0.14)",
    colors: [
      null,
      "#33ff66", // I — phosphor green
      "#ffb000", // O — amber
      "#8a8a70", // T — muted phosphor
      "#33ff66", // S — phosphor green
      "#ffb000", // Z — amber
      "#ccffaa", // J — pale phosphor highlight
      "#ffb000", // L — amber
      "#8a8a70", // N — muted (tuerca)
    ],
    ghostAlpha: 0.1,
    blockHighlight: "rgba(204, 255, 170, 0.22)",
    blockShadow: "rgba(0, 20, 0, 0.55)",
    gridLineWidth: 0.75,
  },
  neon: {
    background: "#000",
    grid: "rgba(0, 245, 255, 0.22)",
    colors: [
      null,
      "#00f5ff", // I — cyan
      "#f5ff00", // O — yellow
      "#ff006e", // T — magenta
      "#00ff88", // S — green
      "#ff2244", // Z — hot red (≠ magenta T)
      "#0099ff", // J — electric blue (≠ cyan I)
      "#ff8800", // L — saturated orange
      "#7788cc", // N — cool steel (tuerca)
    ],
    ghostAlpha: 0.2,
    blockHighlight: "rgba(255, 255, 255, 0.28)",
    blockStroke: "rgba(255, 255, 255, 0.35)",
    glowBlur: 14,
    gridLineWidth: 0.75,
  },
};
