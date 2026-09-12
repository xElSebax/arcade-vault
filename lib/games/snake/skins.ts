import type { GameSkinId } from "@/lib/games/skins/types";

export interface SnakeSkinTokens {
  background: string;
  grid: string;
  body: string;
  bodyGlow: string;
  head: string;
  headOutline: string;
  eyeColor: string;
  glowBlur?: number;
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
    grid: "rgba(26, 26, 34, 0.85)",
    body: "#33ff66",
    bodyGlow: "rgba(51, 255, 102, 0.35)",
    head: "#ccffaa",
    headOutline: "#ffb000",
    eyeColor: "#050508",
  },
  neon: {
    background: "#000",
    grid: "rgba(0, 245, 255, 0.08)",
    body: "#00ff88",
    bodyGlow: "rgba(0, 245, 255, 0.6)",
    head: "#00f5ff",
    headOutline: "#f5ff00",
    eyeColor: "#000",
    glowBlur: 8,
  },
};
