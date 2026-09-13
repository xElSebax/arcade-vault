import { CELL, DOCK_ROW, HOP_MS, START_COL } from "../constants";
import type { Platform } from "./platform";

export interface GridPos {
  col: number;
  row: number;
}

export interface Frog {
  col: number;
  row: number;
  hopFrom: GridPos | null;
  hopTo: GridPos | null;
  hopT: number;
  riding: Platform | null;
}

export function createFrog(): Frog {
  return {
    col: START_COL,
    row: DOCK_ROW,
    hopFrom: null,
    hopTo: null,
    hopT: 0,
    riding: null,
  };
}

export function resetFrog(frog: Frog): void {
  frog.col = START_COL;
  frog.row = DOCK_ROW;
  frog.hopFrom = null;
  frog.hopTo = null;
  frog.hopT = 0;
  frog.riding = null;
}

export function isHopping(frog: Frog): boolean {
  return frog.hopFrom !== null && frog.hopTo !== null;
}

export function startHop(frog: Frog, dCol: number, dRow: number): boolean {
  if (isHopping(frog)) return false;
  frog.hopFrom = { col: frog.col, row: frog.row };
  frog.hopTo = { col: frog.col + dCol, row: frog.row + dRow };
  frog.hopT = 0;
  frog.riding = null;
  return true;
}

/** Advance hop. Returns true when the hop just completed. */
export function updateHop(frog: Frog, dt: number): boolean {
  if (!frog.hopFrom || !frog.hopTo) return false;
  frog.hopT += (dt * 1000) / HOP_MS;
  if (frog.hopT >= 1) {
    frog.col = frog.hopTo.col;
    frog.row = frog.hopTo.row;
    frog.hopFrom = null;
    frog.hopTo = null;
    frog.hopT = 0;
    return true;
  }
  return false;
}

export function frogDisplayCol(frog: Frog): number {
  if (!frog.hopFrom || !frog.hopTo) return frog.col;
  return frog.hopFrom.col + (frog.hopTo.col - frog.hopFrom.col) * frog.hopT;
}

export function frogDisplayRow(frog: Frog): number {
  if (!frog.hopFrom || !frog.hopTo) return frog.row;
  return frog.hopFrom.row + (frog.hopTo.row - frog.hopFrom.row) * frog.hopT;
}

export function frogPixel(frog: Frog): { x: number; y: number; w: number; h: number } {
  const inset = 6;
  return {
    x: frogDisplayCol(frog) * CELL + inset,
    y: frogDisplayRow(frog) * CELL + inset,
    w: CELL - inset * 2,
    h: CELL - inset * 2,
  };
}
