import { HOME_COLS } from "../constants";

export interface Home {
  col: number;
  occupied: boolean;
}

export function createHomes(): Home[] {
  return HOME_COLS.map((col) => ({ col, occupied: false }));
}

export function resetHomes(homes: Home[]): void {
  for (const home of homes) home.occupied = false;
}

export function occupiedCount(homes: Home[]): number {
  return homes.filter((home) => home.occupied).length;
}

export function homeAtCol(homes: Home[], col: number): Home | undefined {
  return homes.find((home) => home.col === col);
}
