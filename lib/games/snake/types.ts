import type { GameSkinId } from "@/lib/games/skins/types";

export type SnakePhase = "playing" | "gameover";

export interface SnakeGameState {
  score: number;
  length: number;
  speed: number;
  phase: SnakePhase;
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
}
