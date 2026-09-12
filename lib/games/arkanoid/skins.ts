import type { GameSkinId } from "@/lib/games/skins/types";
import type { BlockColor } from "./types";

export interface ArkanoidSkinTokens {
  background: string;
  grid?: string;
  gridAlpha?: number;
  /** CSS filter for paddle/ball; classic = none (raw sprites). */
  spriteFilter: string;
  /** Per-block phosphor / neon tint at draw time. */
  blockFilters?: Partial<Record<BlockColor, string>>;
  /** Fallback glow when paddle/ball-specific values are omitted. */
  entityGlowBlur?: number;
  entityGlowColor?: string;
  paddleGlowBlur?: number;
  paddleGlowColor?: string;
  ballGlowBlur?: number;
  ballGlowColor?: string;
  explosionGlowBlur?: number;
  explosionGlowColors?: Partial<Record<BlockColor, string>>;
  /** CRT scanline overlay strength (retro). */
  scanlineAlpha?: number;
}

/** Phosphor tint per block type — amber / green / muted on near-black. */
const RETRO_BLOCK_FILTERS: Record<BlockColor, string> = {
  gray: "sepia(0.35) saturate(0.55) brightness(0.62) hue-rotate(38deg)",
  red: "sepia(1) saturate(3.2) hue-rotate(4deg) brightness(1.18)",
  yellow: "sepia(1) saturate(2.9) hue-rotate(-10deg) brightness(1.12)",
  cyan: "sepia(0.9) saturate(3.1) hue-rotate(74deg) brightness(1.22)",
  magenta: "sepia(0.42) saturate(0.85) hue-rotate(50deg) brightness(0.78)",
  hotpink: "sepia(0.88) saturate(2.3) hue-rotate(16deg) brightness(1.06)",
  green: "sepia(0.78) saturate(2.6) hue-rotate(60deg) brightness(1.14)",
};

/** Brand neon tint per block — cyan / magenta / yellow / green. */
const NEON_BLOCK_FILTERS: Record<BlockColor, string> = {
  gray: "saturate(1.4) brightness(0.78) hue-rotate(198deg) contrast(1.05)",
  red: "saturate(3.8) hue-rotate(298deg) brightness(1.28) contrast(1.1)",
  yellow: "saturate(3.8) hue-rotate(2deg) brightness(1.32) contrast(1.08)",
  cyan: "saturate(3.8) hue-rotate(178deg) brightness(1.28) contrast(1.1)",
  magenta: "saturate(3.8) hue-rotate(288deg) brightness(1.28) contrast(1.1)",
  hotpink: "saturate(3.6) hue-rotate(318deg) brightness(1.24) contrast(1.08)",
  green: "saturate(3.8) hue-rotate(98deg) brightness(1.28) contrast(1.1)",
};

const NEON_EXPLOSION_GLOW: Record<BlockColor, string> = {
  gray: "#8888aa",
  red: "#ff006e",
  yellow: "#f5ff00",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  hotpink: "#ff3366",
  green: "#00ff88",
};

export const ARKANOID_SKINS: Record<GameSkinId, ArkanoidSkinTokens> = {
  classic: {
    background: "#000",
    spriteFilter: "none",
  },
  retro: {
    background: "#050508",
    grid: "#2a2838",
    gridAlpha: 0.52,
    spriteFilter:
      "sepia(0.45) saturate(1.6) hue-rotate(62deg) brightness(0.88)",
    blockFilters: RETRO_BLOCK_FILTERS,
    scanlineAlpha: 0.14,
  },
  neon: {
    background: "#000",
    spriteFilter: "saturate(2.1) brightness(1.12) contrast(1.08)",
    blockFilters: NEON_BLOCK_FILTERS,
    paddleGlowBlur: 14,
    paddleGlowColor: "#00f5ff",
    ballGlowBlur: 18,
    ballGlowColor: "#f5ff00",
    explosionGlowBlur: 10,
    explosionGlowColors: NEON_EXPLOSION_GLOW,
  },
};
