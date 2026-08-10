import { BASE_BALL_VX, BASE_BALL_VY } from "../constants";
import type { Paddle } from "./paddle";

export interface Ball {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

export const BALL_W = 16;
export const BALL_H = 16;

export function createBallOnPaddle(paddle: Paddle, speedMultiplier: number): Ball {
  return {
    x: paddle.x + (paddle.w - BALL_W) / 2,
    y: paddle.y - BALL_H,
    w: BALL_W,
    h: BALL_H,
    vx: BASE_BALL_VX * speedMultiplier,
    vy: BASE_BALL_VY * speedMultiplier,
  };
}
