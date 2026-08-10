/** Grid columns. */
export const COLS = 30;

/** Grid rows. */
export const ROWS = 30;

/** Cell size in pixels (canvas: COLS×CELL × ROWS×CELL = 600×600). */
export const CELL = 20;

/** Canvas width in pixels. */
export const W = 600;

/** Canvas height in pixels. */
export const H = 600;

/** Points awarded per fruit eaten. */
export const POINTS_PER_FRUIT = 10;

/** Milliseconds between movement ticks at game start. */
export const SPEED_INITIAL = 150;

/** Fastest tick interval (speed cap). */
export const SPEED_MIN = 60;

/** Milliseconds removed from tick interval per speed increase. */
export const SPEED_STEP = 10;

/** Fruits eaten between each speed increase. */
export const SPEED_EVERY = 5;

/** Starting segment count (including head). */
export const INITIAL_SNAKE_LENGTH = 3;
