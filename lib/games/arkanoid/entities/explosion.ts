import type { BlockColor } from "../types";
import type { Block } from "./block";

export interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  elapsed: number;
}

export function createExplosion(block: Block): Explosion {
  return {
    x: block.x,
    y: block.y,
    w: block.w,
    h: block.h,
    color: block.color,
    elapsed: 0,
  };
}
