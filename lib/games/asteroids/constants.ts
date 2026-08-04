/** Canvas dimensions (fixed). */
export const W = 800;
export const H = 600;

/** Asteroid radius by size index (1 = small, 2 = medium, 3 = large). */
export const RADII = [0, 16, 30, 50] as const;

/** Base speed (px/s) by asteroid size index. */
export const SPEEDS = [0, 85, 55, 32] as const;

/** Score awarded by asteroid size index. */
export const POINTS = [0, 100, 50, 20] as const;

/** Chance an asteroid drops a triple-shot power-up on destroy. */
export const POWERUP_DROP_CHANCE = 0.15;

/** Seconds of triple-shot after collecting a power-up. */
export const POWERUP_DURATION = 5;

/** Seconds before an uncollected power-up despawns. */
export const POWERUP_TTL = 12;

/** Angular spread (rad) for triple-shot side bullets. */
export const TRIPLE_SPREAD = 0.18;

/** Max delta time per frame (seconds) to avoid spiral-of-death. */
export const MAX_DT = 0.05;
