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
  glowBlur?: number;
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
    grid: "#1a1a22",
    colors: [
      null,
      "#33ff66", // I — phosphor green
      "#ffb000", // O — amber
      "#8a8a70", // T — muted phosphor
      "#66cc88", // S — soft green
      "#cc8866", // Z — warm amber-red
      "#99ddaa", // J — pale phosphor
      "#e6a030", // L — deep amber
      "#6a6a58", // N — dark muted
    ],
    ghostAlpha: 0.18,
    blockHighlight: "rgba(204, 255, 170, 0.15)",
  },
  neon: {
    background: "#000",
    grid: "rgba(0, 245, 255, 0.08)",
    colors: [
      null,
      "#00f5ff", // I — cyan
      "#f5ff00", // O — yellow
      "#ff006e", // T — magenta
      "#00ff88", // S — green
      "#ff3366", // Z — hot pink-red
      "#66f8ff", // J — light cyan
      "#ffaa00", // L — orange
      "#8888aa", // N — cool grey
    ],
    ghostAlpha: 0.22,
    blockHighlight: "rgba(0, 245, 255, 0.18)",
    glowBlur: 6,
  },
};
