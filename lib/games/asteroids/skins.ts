import type { GameSkinId } from "@/lib/games/skins/types";

export interface AsteroidsSkinTokens {
  background: string;
  grid?: string;
  /** Grid line width; defaults to 1 in engine. */
  gridLineWidth?: number;
  ship: string;
  shipThrust: string;
  asteroid: string;
  bullet: string;
  powerUp: string;
  particleRgb: readonly [number, number, number];
  hud: string;
  hudTripleShot: string;
  lifeIcon: string;
  glowBlur?: number;
  /** Softer glow for dense particles; defaults to half of glowBlur. */
  particleGlowBlur?: number;
}

export const ASTEROIDS_SKINS: Record<GameSkinId, AsteroidsSkinTokens> = {
  classic: {
    background: "#000",
    ship: "#fff",
    shipThrust: "rgba(255, 130, 0, 0.85)",
    asteroid: "#fff",
    bullet: "#fff",
    powerUp: "#0ff",
    particleRgb: [255, 255, 255],
    hud: "#fff",
    hudTripleShot: "#0ff",
    lifeIcon: "#fff",
  },
  retro: {
    background: "#050508",
    grid: "rgba(42, 42, 56, 0.65)",
    gridLineWidth: 0.5,
    ship: "#33ff66",
    shipThrust: "rgba(255, 176, 0, 0.9)",
    asteroid: "#a89858",
    bullet: "#e6ffb8",
    powerUp: "#ffb000",
    particleRgb: [255, 176, 0],
    hud: "#ccffaa",
    hudTripleShot: "#ffb000",
    lifeIcon: "#33ff66",
  },
  neon: {
    background: "#000",
    grid: "rgba(0, 245, 255, 0.1)",
    gridLineWidth: 0.5,
    ship: "#00f5ff",
    shipThrust: "rgba(255, 0, 110, 0.95)",
    asteroid: "#00ff88",
    bullet: "#f5ff00",
    powerUp: "#ff006e",
    particleRgb: [0, 245, 255],
    hud: "#00f5ff",
    hudTripleShot: "#f5ff00",
    lifeIcon: "#00f5ff",
    glowBlur: 12,
    particleGlowBlur: 5,
  },
};
