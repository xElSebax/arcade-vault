import { COLORS, COLS, ROWS } from "./constants";

export interface ActivePiece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

/** Rotate a piece matrix 90° clockwise. */
export function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      result[c][rows - 1 - r] = shape[r][c];
    }
  }
  return result;
}

/** Check collision with board edges and locked cells. */
export function collide(
  board: number[][],
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

/** Project active piece down until collision; returns ghost row offset. */
export function ghostY(current: ActivePiece, board: number[][]): number {
  let gy = current.y;
  while (!collide(board, current.shape, current.x, gy + 1)) {
    gy++;
  }
  return gy;
}

/** Draw a single board cell at grid coordinates (x, y). */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha?: number,
): void {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  if (!color) return;

  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}
