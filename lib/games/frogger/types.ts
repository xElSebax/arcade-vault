import type { GameSkinId } from "@/lib/games/skins/types";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";

export type FroggerPhase = "playing" | "win" | "gameover";

export interface FroggerGameState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  frogsHome: number;
  phase: FroggerPhase;
}

/** Visible HUD fields synced from the engine (no phase — overlays use separate state). */
export interface FroggerHudState {
  score: number;
  lives: number;
  level: number;
  timeLeft: number;
  frogsHome: number;
}

export function froggerHudFromGameState(state: FroggerGameState): FroggerHudState {
  return {
    score: state.score,
    lives: state.lives,
    level: state.level,
    timeLeft: state.timeLeft,
    frogsHome: state.frogsHome,
  };
}

export function froggerHudEquals(a: FroggerHudState, b: FroggerHudState): boolean {
  return (
    a.score === b.score &&
    a.lives === b.lives &&
    a.level === b.level &&
    a.timeLeft === b.timeLeft &&
    a.frogsHome === b.frogsHome
  );
}

export interface FroggerEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: FroggerGameState) => void): () => void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  setVirtualInput(state: VirtualInputState): void;
  pulseVirtualAction(action: TouchAction): void;
}

export type VehicleKind = "car" | "truck" | "bus";
export type PlatformKind = "log" | "turtle";
export type LaneKind = "road" | "river";
export type LaneDir = 1 | -1;

export interface RoadLaneDef {
  kind: "road";
  row: number;
  dir: LaneDir;
  baseSpeed: number;
  gapMin: number;
  gapMax: number;
  vehicleKind: VehicleKind;
  widthCells: number;
}

export interface RiverLaneDef {
  kind: "river";
  row: number;
  dir: LaneDir;
  baseSpeed: number;
  gapMin: number;
  gapMax: number;
  platformKind: PlatformKind;
  widthCells: number;
}

export type LaneDef = RoadLaneDef | RiverLaneDef;
