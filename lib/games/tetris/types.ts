export type TetrisPhase = "playing" | "gameover";

export interface TetrisGameState {
  score: number;
  lines: number;
  level: number;
  phase: TetrisPhase;
}

export interface TetrisEngine {
  mount(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement): void;
  unmount(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  onStateChange(cb: (state: TetrisGameState) => void): () => void;
}
