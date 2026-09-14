import type { GameSkinId } from "@/lib/games/skins/types";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";

export type ArkanoidPhase = "playing" | "gameover" | "win";

export type BlockColor =
  | "gray"
  | "red"
  | "yellow"
  | "cyan"
  | "magenta"
  | "hotpink"
  | "green";

export interface ArkanoidGameState {
  score: number;
  lives: number;
  level: number;
  phase: ArkanoidPhase;
}

/** Campos visibles en GamePlayerShell (sin phase — overlays aparte). */
export interface ArkanoidHudState {
  score: number;
  lives: number;
  level: number;
}

export function arkanoidHudFromGameState(
  state: ArkanoidGameState,
): ArkanoidHudState {
  return {
    score: state.score,
    lives: state.lives,
    level: state.level,
  };
}

export function arkanoidHudEquals(
  a: ArkanoidHudState,
  b: ArkanoidHudState,
): boolean {
  return a.score === b.score && a.lives === b.lives && a.level === b.level;
}

export interface ArkanoidEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  onStateChange(cb: (state: ArkanoidGameState) => void): () => void;
  setVirtualInput(state: VirtualInputState): void;
  pulseVirtualAction(action: TouchAction): void;
}
