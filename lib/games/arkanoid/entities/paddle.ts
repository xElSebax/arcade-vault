import { W } from "../constants";

export interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PADDLE_W = 81;
export const PADDLE_H = 14;
export const PADDLE_Y = 560;

export function createPaddle(): Paddle {
  return {
    x: (W - PADDLE_W) / 2,
    y: PADDLE_Y,
    w: PADDLE_W,
    h: PADDLE_H,
  };
}
