import type { GameSkinId } from "@/lib/games/skins/types";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";

export type TetrisPhase = "playing" | "gameover";

export interface TetrisGameState {
  score: number;
  lines: number;
  level: number;
  phase: TetrisPhase;
}

/** Visible HUD fields driven by the engine (not pause/over overlays). */
export interface TetrisHudState {
  score: number;
  lines: number;
  level: number;
}

export function tetrisHudFromGameState(state: TetrisGameState): TetrisHudState {
  return {
    score: state.score,
    lines: state.lines,
    level: state.level,
  };
}

export function tetrisHudEquals(a: TetrisHudState, b: TetrisHudState): boolean {
  return a.score === b.score && a.lines === b.lines && a.level === b.level;
}

export interface TetrisEngine {
  mount(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  onStateChange(cb: (state: TetrisGameState) => void): () => void;
  setVirtualInput(state: VirtualInputState): void;
  pulseVirtualAction(action: TouchAction): void;
}
