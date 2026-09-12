import type { GameTouchMap } from "./types";

export const TOUCH_MAPS: Record<
  "snake" | "asteroids" | "tetris" | "arkanoid",
  GameTouchMap
> = {
  snake: {
    up: "move_up",
    down: "move_down",
    left: "move_left",
    right: "move_right",
    a: null,
    b: null,
  },
  asteroids: {
    up: "thrust",
    down: null,
    left: "rotate_left",
    right: "rotate_right",
    a: "fire",
    b: null,
  },
  tetris: {
    up: "rotate",
    down: "soft_drop",
    left: "move_left",
    right: "move_right",
    a: "hard_drop",
    b: null,
  },
  arkanoid: {
    up: null,
    down: null,
    left: "move_left",
    right: "move_right",
    a: null,
    b: null,
  },
};
