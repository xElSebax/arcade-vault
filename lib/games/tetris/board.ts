import { COLS, ROWS } from "./constants";
import type { ActivePiece } from "./utils";

/** Empty ROWS×COLS matrix (0 = vacant cell). */
export function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
}

/** Lock the active piece cells onto the board. */
export function merge(board: number[][], piece: ActivePiece): void {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        board[piece.y + r][piece.x + c] = piece.shape[r][c];
      }
    }
  }
}

/** Remove full rows; returns how many lines were cleared. */
export function clearLines(board: number[][]): number {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every((v) => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array<number>(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  return cleared;
}
