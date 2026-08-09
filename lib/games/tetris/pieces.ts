import { LINE_SCORES, COLS, PIECES } from "./constants";
import { clearLines, createBoard, merge } from "./board";
import type { TetrisPhase } from "./types";
import { type ActivePiece, collide, ghostY, rotateCW } from "./utils";

export interface TetrisPlayState {
  board: number[][];
  current: ActivePiece;
  next: ActivePiece;
  score: number;
  lines: number;
  level: number;
  dropInterval: number;
  phase: TetrisPhase;
}

const WALL_KICKS = [0, -1, 1, -2, 2] as const;

/** Drop interval (ms) for a given level. */
export function dropIntervalForLevel(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 90);
}

/** Level from total lines cleared. */
export function levelFromLines(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

/** Random piece of type 1–8, centered at spawn row. */
export function randomPiece(): ActivePiece {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type]!.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

/** Rotate clockwise with basic wall kicks; mutates `current` on success. */
export function tryRotate(current: ActivePiece, board: number[][]): boolean {
  const rotated = rotateCW(current.shape);
  for (const kick of WALL_KICKS) {
    if (!collide(board, rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return true;
    }
  }
  return false;
}

/** Apply line-clear scoring and level speed after `clearLines`. */
export function applyLineClear(state: TetrisPlayState, cleared: number): void {
  if (!cleared) return;
  state.lines += cleared;
  state.score += (LINE_SCORES[cleared] ?? 0) * state.level;
  state.level = levelFromLines(state.lines);
  state.dropInterval = dropIntervalForLevel(state.level);
}

/** Promote `next` to `current` and queue a new piece; game over if blocked. */
export function spawn(state: TetrisPlayState): TetrisPhase {
  state.current = state.next;
  state.next = randomPiece();
  if (collide(state.board, state.current.shape, state.current.x, state.current.y)) {
    state.phase = "gameover";
    return "gameover";
  }
  state.phase = "playing";
  return "playing";
}

/** Merge current piece, clear lines, spawn next. */
export function lockPiece(state: TetrisPlayState): TetrisPhase {
  merge(state.board, state.current);
  const cleared = clearLines(state.board);
  applyLineClear(state, cleared);
  return spawn(state);
}

/** Move down one row (+1 point) or lock if blocked. */
export function softDrop(state: TetrisPlayState): TetrisPhase {
  if (!collide(state.board, state.current.shape, state.current.x, state.current.y + 1)) {
    state.current.y++;
    state.score += 1;
    return state.phase;
  }
  return lockPiece(state);
}

/** Drop to ghost position (+2 pts/cell) then lock. */
export function hardDrop(state: TetrisPlayState): TetrisPhase {
  const gy = ghostY(state.current, state.board);
  state.score += (gy - state.current.y) * 2;
  state.current.y = gy;
  return lockPiece(state);
}

/** Fresh play state for `reset()`. */
export function createInitialState(): TetrisPlayState {
  const state: TetrisPlayState = {
    board: createBoard(),
    current: randomPiece(),
    next: randomPiece(),
    score: 0,
    lines: 0,
    level: 1,
    dropInterval: dropIntervalForLevel(1),
    phase: "playing",
  };
  spawn(state);
  return state;
}
