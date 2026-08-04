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
  onStateChange(cb: (state: AsteroidsGameState) => void): () => void;
}
