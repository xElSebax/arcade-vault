/** Grid columns. */
export const COLS = 12;

/** Grid rows. */
export const ROWS = 16;

/** Cell size in pixels. */
export const CELL = 40;

/** Canvas width in pixels. */
export const W = 480;

/** Canvas height in pixels. */
export const H = 640;

/** Starting lives. */
export const STARTING_LIVES = 3;

/** Seconds per level. */
export const LEVEL_TIME_SEC = 30;

/** Hop animation duration in milliseconds. */
export const HOP_MS = 120;

/** Points for each new row reached toward home. */
export const POINTS_PER_ROW = 10;

/** Points for occupying a lily pad. */
export const POINTS_HOME = 50;

/** Multiplier for leftover time when a level is cleared. */
export const TIME_BONUS_MULT = 10;

/** Speed increase per level: `1 + (level - 1) * SPEED_SCALE`. */
export const SPEED_SCALE = 0.12;

/** Extra density per level (shrinks spawn gaps). */
export const DENSITY_SCALE = 0.08;

/** Lily pad columns. */
export const HOME_COLS = [1, 3, 5, 7, 9] as const;

/** Road lane row indices (traffic). */
export const ROAD_ROWS = [10, 11, 12, 13, 14] as const;

/** River lane row indices. */
export const RIVER_ROWS = [4, 5, 6, 7, 8] as const;

/** Safe grass median row. */
export const MEDIAN_ROW = 9;

/** Starting dock row. */
export const DOCK_ROW = 15;

/** Home / lily pad row. */
export const HOME_ROW = 3;

/** Starting frog column (center of the 12-wide grid). */
export const START_COL = 6;

/** Turtle visible duration in seconds. */
export const TURTLE_VISIBLE_SEC = 3;

/** Turtle submerged duration in seconds. */
export const TURTLE_SUNK_SEC = 1.5;

/** Cap delta time to avoid large physics jumps. */
export const MAX_DT = 0.05;

/** Seconds to freeze on `phase: "win"` before the next level starts. */
export const WIN_HOLD_SEC = 1.2;

/** CRT palette from the spec. */
export const PALETTE = {
  asphalt: "#2a2a2a",
  grass: "#1a4d1a",
  river: "#004466",
  frog: "#33ff66",
  magenta: "#ff44cc",
  cyan: "#00f5ff",
  home: "#33cc88",
  homeOccupied: "#ffe566",
} as const;
