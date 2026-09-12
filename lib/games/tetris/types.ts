export type TetrisPhase = "playing" | "gameover";

export interface TetrisGameState {
  score: number;
  lines: number;
  level: number;
  phase: TetrisPhase;
}

import type { GameSkinId } from "@/lib/games/skins/types";

export interface TetrisEngine {
  mount(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  onStateChange(cb: (state: TetrisGameState) => void): () => void;
}
