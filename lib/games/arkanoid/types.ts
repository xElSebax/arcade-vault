import type { GameSkinId } from "@/lib/games/skins/types";

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

export interface ArkanoidEngine {
  mount(canvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  setSkin(skin: GameSkinId): void;
  getSkin(): GameSkinId;
  onStateChange(cb: (state: ArkanoidGameState) => void): () => void;
}
