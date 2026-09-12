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
