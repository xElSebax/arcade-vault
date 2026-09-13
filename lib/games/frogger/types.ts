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
