import type { GameSkinId } from "@/lib/games/skins/types";

export interface AsteroidsSkinTokens {
  background: string;
  grid?: string;
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
    grid: "#1a1a22",
    ship: "#33ff66",
    shipThrust: "rgba(255, 176, 0, 0.85)",
    asteroid: "#8a8a70",
    bullet: "#ccffaa",
    powerUp: "#ffb000",
    particleRgb: [51, 255, 102],
    hud: "#ccffaa",
    hudTripleShot: "#ffb000",
    lifeIcon: "#33ff66",
  },
  neon: {
    background: "#000",
    ship: "#00f5ff",
    shipThrust: "rgba(255, 0, 110, 0.9)",
    asteroid: "#00ff88",
    bullet: "#f5ff00",
    powerUp: "#ff006e",
    particleRgb: [0, 245, 255],
    hud: "#00f5ff",
    hudTripleShot: "#f5ff00",
    lifeIcon: "#00f5ff",
    glowBlur: 8,
  },
};
