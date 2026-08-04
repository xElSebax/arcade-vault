export interface Vec2 {
  x: number;
  y: number;
}

/** Toroidal wrap for canvas coordinates. */
export function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

/** Euclidean distance between two points. */
export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Random float in [min, max). */
export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] (inclusive). */
export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}
