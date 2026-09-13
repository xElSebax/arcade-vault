import { CELL, TURTLE_SUNK_SEC, TURTLE_VISIBLE_SEC } from "../constants";
import type { PlatformKind } from "../types";

const TURTLE_CYCLE = TURTLE_VISIBLE_SEC + TURTLE_SUNK_SEC;

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  kind: PlatformKind;
  row: number;
  sinkPhase: number;
}

export function createPlatform(opts: {
  x: number;
  row: number;
  vx: number;
  kind: PlatformKind;
  widthCells: number;
  sinkPhase?: number;
}): Platform {
  const h = CELL * 0.72;
  return {
    x: opts.x,
    y: opts.row * CELL + (CELL - h) / 2,
    w: opts.widthCells * CELL,
    h,
    vx: opts.vx,
    kind: opts.kind,
    row: opts.row,
    sinkPhase: opts.sinkPhase ?? 0,
  };
}

export function isPlatformRideable(platform: Platform): boolean {
  if (platform.kind !== "turtle") return true;
  return platform.sinkPhase < TURTLE_VISIBLE_SEC;
}

export function updatePlatform(platform: Platform, dt: number, worldW: number): void {
  platform.x += platform.vx * dt;
  if (platform.kind === "turtle") {
    platform.sinkPhase = (platform.sinkPhase + dt) % TURTLE_CYCLE;
  }
  if (platform.vx > 0 && platform.x > worldW) {
    platform.x = -platform.w;
  } else if (platform.vx < 0 && platform.x + platform.w < 0) {
    platform.x = worldW;
  }
}
