import type { GameSkinId } from "@/lib/games/skins/types";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";

export type SnakePhase = "playing" | "gameover";

export interface SnakeGameState {
  score: number;
  length: number;
  speed: number;
  phase: SnakePhase;
}

/** Visible HUD fields for GamePlayerShell (score + length). */
export interface SnakeHudState {
  score: number;
  length: number;
}

export function snakeHudFromGameState(state: SnakeGameState): SnakeHudState {
  return {
    score: state.score,
    length: state.length,
  };
}

export function snakeHudEquals(a: SnakeHudState, b: SnakeHudState): boolean {
  return a.score === b.score && a.length === b.length;
}

export interface SnakeEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: SnakeGameState) => void): () => void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  setVirtualInput(state: VirtualInputState): void;
  pulseVirtualAction(action: TouchAction): void;
}
