import type { GameSkinId } from "@/lib/games/skins/types";
import { PALETTE } from "./constants";

export interface FroggerSkinTokens {
  background: string;
  grass: string;
  asphalt: string;
  river: string;
  riverHighlight: string;
  medianLine: string;
  roadDash: string;
  grid: string;
  frog: string;
  frogEye: string;
  frogGlow?: string;
  frogGlowBlur?: number;
  car: string;
  truck: string;
  bus: string;
  vehicleCabin: string;
  vehicleWheel: string;
  vehicleGlowBlur?: number;
  log: string;
  logHighlight: string;
  turtle: string;
  turtleSunk: string;
  home: string;
  homeOccupied: string;
  homeStroke: string;
  homeOccupiedStroke: string;
  scanlineOpacity?: number;
}

export const FROGGER_SKINS: Record<GameSkinId, FroggerSkinTokens> = {
  classic: {
    background: "#07140c",
    grass: PALETTE.grass,
    asphalt: PALETTE.asphalt,
    river: PALETTE.river,
    riverHighlight: "rgba(0, 245, 255, 0.08)",
    medianLine: "rgba(51, 255, 102, 0.12)",
    roadDash: "rgba(255, 255, 255, 0.14)",
    grid: "rgba(51, 255, 102, 0.06)",
    frog: PALETTE.frog,
    frogEye: "#0a0a18",
    car: PALETTE.magenta,
    truck: PALETTE.cyan,
    bus: "#ffe566",
    vehicleCabin: "rgba(10, 10, 24, 0.45)",
    vehicleWheel: "#0a0a18",
    log: "#8a4a22",
    logHighlight: "#c47a3a",
    turtle: "#2e8f4a",
    turtleSunk: "rgba(0, 80, 90, 0.45)",
    home: PALETTE.home,
    homeOccupied: PALETTE.homeOccupied,
    homeStroke: "#0a3a22",
    homeOccupiedStroke: "#886600",
  },
  retro: {
    background: "#050508",
    grass: "#0c2814",
    asphalt: "#121210",
    river: "#081810",
    riverHighlight: "rgba(51, 255, 102, 0.1)",
    medianLine: "rgba(255, 176, 0, 0.22)",
    roadDash: "rgba(255, 176, 0, 0.18)",
    grid: "rgba(51, 255, 102, 0.08)",
    frog: "#33ff66",
    frogEye: "#1a1008",
    car: "#ffb000",
    truck: "#8a8a70",
    bus: "#ccffaa",
    vehicleCabin: "rgba(8, 8, 4, 0.5)",
    vehicleWheel: "#1a1008",
    log: "#6a5420",
    logHighlight: "#ffb000",
    turtle: "#2a6b38",
    turtleSunk: "rgba(20, 40, 24, 0.55)",
    home: "#3a6b44",
    homeOccupied: "#ffb000",
    homeStroke: "#1a2a18",
    homeOccupiedStroke: "#8a6000",
    scanlineOpacity: 0.12,
  },
  neon: {
    background: "#000",
    grass: "#041208",
    asphalt: "#0a0a12",
    river: "#001820",
    riverHighlight: "rgba(0, 245, 255, 0.22)",
    medianLine: "rgba(0, 255, 136, 0.28)",
    roadDash: "rgba(0, 245, 255, 0.28)",
    grid: "rgba(0, 245, 255, 0.08)",
    frog: "#00ff88",
    frogEye: "#000",
    frogGlow: "rgba(0, 255, 136, 0.85)",
    frogGlowBlur: 14,
    car: "#ff006e",
    truck: "#00f5ff",
    bus: "#f5ff00",
    vehicleCabin: "rgba(0, 0, 0, 0.5)",
    vehicleWheel: "#000",
    vehicleGlowBlur: 8,
    log: "#3a2010",
    logHighlight: "#ff006e",
    turtle: "#00f5ff",
    turtleSunk: "rgba(0, 80, 90, 0.4)",
    home: "#00ff88",
    homeOccupied: "#f5ff00",
    homeStroke: "#003322",
    homeOccupiedStroke: "#887700",
  },
};
