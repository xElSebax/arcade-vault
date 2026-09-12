/** Canvas dimensions (fixed). */
export const W = 800;
export const H = 600;

/** Paddle movement speed (px/s) with keyboard / hold táctil. */
export const PADDLE_SPEED = 400;

/** Desplazamiento discreto por tap táctil (px). */
export const PADDLE_STEP = 32;

/** Block grid dimensions. */
export const BLOCK_COLS = 10;
export const BLOCK_ROWS = 6;

/** Block cell size (px). */
export const BLOCK_W = 64;
export const BLOCK_H = 24;

/** Top-left origin of the block grid. */
export const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
export const BLOCKS_ORIGIN_Y = 80;

/** Base ball velocity (px/s) before level speed multiplier. */
export const BASE_BALL_VX = 200;
export const BASE_BALL_VY = -300;

/** Points awarded per destroyed block. */
export const BLOCK_SCORE = 10;

/** Lives at game start. */
export const STARTING_LIVES = 3;

/** Explosion animation duration (ms). */
export const EXPLOSION_DURATION = 150;

/** Max delta time per frame (seconds) to avoid spiral-of-death. */
export const MAX_DT = 0.05;
