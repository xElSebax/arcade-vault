import type { GameSkinId } from "@/lib/games/skins/types";

export interface SnakeSkinTokens {
  background: string;
  grid: string;
  body: string;
  bodyGlow: string;
  head: string;
  headOutline: string;
  eyeColor: string;
  /** Glow on body segments; classic default 5. */
  glowBlur?: number;
  /** Glow on head; falls back to glowBlur then 10. */
  headGlowBlur?: number;
  /** CSS filter on fruit sprites; classic = none. */
  fruitFilter?: string;
  /** CRT scanline overlay opacity (0–1); retro only. */
  scanlineOpacity?: number;
}

export const SNAKE_SKINS: Record<GameSkinId, SnakeSkinTokens> = {
  classic: {
    background: "#0a0a12",
    grid: "rgba(0, 255, 136, 0.1)",
    body: "#00ff88",
    bodyGlow: "rgba(0, 255, 136, 0.55)",
    head: "#88ffbb",
    headOutline: "#00ffcc",
    eyeColor: "#0a0a12",
  },
  retro: {
    background: "#050508",
    grid: "rgba(255, 176, 0, 0.18)",
    body: "#3a6b44",
    bodyGlow: "rgba(58, 107, 68, 0.2)",
    head: "#ffb000",
    headOutline: "#ffdd66",
    eyeColor: "#1a1008",
    glowBlur: 2,
    fruitFilter: "sepia(0.35) saturate(0.8) hue-rotate(10deg) brightness(0.88)",
    scanlineOpacity: 0.12,
  },
  neon: {
    background: "#000",
    grid: "rgba(0, 245, 255, 0.1)",
    body: "#ff006e",
    bodyGlow: "rgba(255, 0, 110, 0.75)",
    head: "#00f5ff",
    headOutline: "#f5ff00",
    eyeColor: "#000",
    glowBlur: 12,
    headGlowBlur: 16,
    fruitFilter: "saturate(1.6) brightness(1.08) contrast(1.05)",
  },
};
