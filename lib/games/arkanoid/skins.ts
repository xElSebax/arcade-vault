import type { GameSkinId } from "@/lib/games/skins/types";

export interface ArkanoidSkinTokens {
  background: string;
  grid?: string;
  /** CSS filter applied to all sprite draws; classic = none (raw sprites). */
  spriteFilter: string;
  /** Glow on paddle and ball (neon only). */
  entityGlowBlur?: number;
  entityGlowColor?: string;
}

export const ARKANOID_SKINS: Record<GameSkinId, ArkanoidSkinTokens> = {
  classic: {
    background: "#000",
    spriteFilter: "none",
  },
  retro: {
    background: "#050508",
    grid: "#1a1a22",
    spriteFilter:
      "sepia(0.3) saturate(1.25) hue-rotate(65deg) brightness(0.92)",
  },
  neon: {
    background: "#000",
    spriteFilter: "saturate(1.75) brightness(1.12) contrast(1.08)",
    entityGlowBlur: 6,
    entityGlowColor: "#00f5ff",
  },
};
