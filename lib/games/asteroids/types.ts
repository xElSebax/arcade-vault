import type { GameSkinId } from "@/lib/games/skins/types";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";

export type AsteroidsPhase = "playing" | "dead" | "gameover";

export interface AsteroidsGameState {
  score: number;
  lives: number;
  level: number;
  phase: AsteroidsPhase;
}

/** Visible HUD fields synced from the engine (phase uses overlay state). */
export interface AsteroidsHudState {
  score: number;
  lives: number;
  level: number;
}

export function asteroidsHudFromGameState(
  state: AsteroidsGameState,
): AsteroidsHudState {
  return {
    score: state.score,
    lives: state.lives,
    level: state.level,
  };
}

export function asteroidsHudEquals(
  a: AsteroidsHudState,
  b: AsteroidsHudState,
): boolean {
  return a.score === b.score && a.lives === b.lives && a.level === b.level;
}

export interface AsteroidsEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  onStateChange(cb: (state: AsteroidsGameState) => void): () => void;
  setVirtualInput(state: VirtualInputState): void;
  pulseVirtualAction(action: TouchAction): void;
}
