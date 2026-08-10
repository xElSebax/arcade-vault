import {
  COLS,
  ROWS,
  SPEED_EVERY,
  SPEED_INITIAL,
  SPEED_MIN,
  SPEED_STEP,
} from "./constants";
import { FRUIT_TYPES, type FruitType } from "./sprites";

export interface Vec2 {
  x: number;
  y: number;
}

export interface Fruit {
  x: number;
  y: number;
  type: FruitType;
}

export type Direction = Vec2;

/** True when the requested direction is a 180° reversal of the current one. */
export function isOppositeDirection(
  current: Direction,
  next: Direction,
): boolean {
  return current.x + next.x === 0 && current.y + next.y === 0;
}

/** Apply a direction change, blocking instant 180° turns. */
export function resolveDirection(
  current: Direction,
  requested: Direction,
): Direction {
  if (isOppositeDirection(current, requested)) return current;
  return requested;
}

/** Map keyboard input to a grid direction, or null if not a movement key. */
export function directionFromKey(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return { x: 0, y: -1 };
    case "ArrowDown":
    case "s":
    case "S":
      return { x: 0, y: 1 };
    case "ArrowLeft":
    case "a":
    case "A":
      return { x: -1, y: 0 };
    case "ArrowRight":
    case "d":
    case "D":
      return { x: 1, y: 0 };
    default:
      return null;
  }
}

/** True if coordinates are outside the grid bounds. */
export function isWallCollision(x: number, y: number): boolean {
  return x < 0 || x >= COLS || y < 0 || y >= ROWS;
}

/** True if the head overlaps any body segment (index 1+). */
export function isBodyCollision(head: Vec2, snake: Vec2[]): boolean {
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return true;
  }
  return false;
}

/** True if the head hits a wall or the snake's own body. */
export function hitsWallOrBody(head: Vec2, snake: Vec2[]): boolean {
  if (isWallCollision(head.x, head.y)) return true;
  return isBodyCollision(head, snake);
}

function getFreeCells(snake: Vec2[]): Vec2[] {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const free: Vec2[] = [];

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }

  return free;
}

/** Place a random fruit on a free cell; null when the grid is full. */
export function spawnFruit(snake: Vec2[]): Fruit | null {
  const free = getFreeCells(snake);
  if (free.length === 0) return null;

  const pos = free[Math.floor(Math.random() * free.length)];
  const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

  return { x: pos.x, y: pos.y, type };
}

/** Tick interval after eating `fruitsEaten` fruits (lower = faster). */
export function speedAfterFruits(fruitsEaten: number): number {
  const levels = Math.floor(fruitsEaten / SPEED_EVERY);
  return Math.max(SPEED_MIN, SPEED_INITIAL - levels * SPEED_STEP);
}

/** Build the initial snake centered horizontally, facing right. */
export function createInitialSnake(length: number): Vec2[] {
  const startX = Math.floor(COLS / 2);
  const startY = Math.floor(ROWS / 2);
  const snake: Vec2[] = [];

  for (let i = 0; i < length; i++) {
    snake.push({ x: startX - i, y: startY });
  }

  return snake;
}
