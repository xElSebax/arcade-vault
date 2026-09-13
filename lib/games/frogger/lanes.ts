import { CELL, DENSITY_SCALE, SPEED_SCALE } from "./constants";
import type { LaneDef, RoadLaneDef, RiverLaneDef } from "./types";

/**
 * Five road lanes (rows 10–14) and five river lanes (rows 4–8).
 * Directions alternate. Speeds are px/s at level 1.
 * Gaps are px between spawned entities at level 1.
 */
export const LANES: readonly LaneDef[] = [
  {
    kind: "road",
    row: 14,
    dir: -1,
    baseSpeed: 72,
    gapMin: CELL * 3,
    gapMax: CELL * 5,
    vehicleKind: "car",
    widthCells: 1.4,
  },
  {
    kind: "road",
    row: 13,
    dir: 1,
    baseSpeed: 96,
    gapMin: CELL * 3.5,
    gapMax: CELL * 5.5,
    vehicleKind: "truck",
    widthCells: 2.2,
  },
  {
    kind: "road",
    row: 12,
    dir: -1,
    baseSpeed: 58,
    gapMin: CELL * 4,
    gapMax: CELL * 6,
    vehicleKind: "bus",
    widthCells: 2.8,
  },
  {
    kind: "road",
    row: 11,
    dir: 1,
    baseSpeed: 110,
    gapMin: CELL * 3,
    gapMax: CELL * 4.5,
    vehicleKind: "car",
    widthCells: 1.4,
  },
  {
    kind: "road",
    row: 10,
    dir: -1,
    baseSpeed: 84,
    gapMin: CELL * 3.2,
    gapMax: CELL * 5,
    vehicleKind: "truck",
    widthCells: 2.2,
  },
  {
    kind: "river",
    row: 8,
    dir: 1,
    baseSpeed: 50,
    gapMin: CELL * 2.5,
    gapMax: CELL * 4,
    platformKind: "log",
    widthCells: 3,
  },
  {
    kind: "river",
    row: 7,
    dir: -1,
    baseSpeed: 42,
    gapMin: CELL * 2.2,
    gapMax: CELL * 3.6,
    platformKind: "turtle",
    widthCells: 2,
  },
  {
    kind: "river",
    row: 6,
    dir: 1,
    baseSpeed: 64,
    gapMin: CELL * 2.8,
    gapMax: CELL * 4.4,
    platformKind: "log",
    widthCells: 4,
  },
  {
    kind: "river",
    row: 5,
    dir: -1,
    baseSpeed: 48,
    gapMin: CELL * 2.4,
    gapMax: CELL * 3.8,
    platformKind: "turtle",
    widthCells: 3,
  },
  {
    kind: "river",
    row: 4,
    dir: 1,
    baseSpeed: 36,
    gapMin: CELL * 3,
    gapMax: CELL * 5,
    platformKind: "log",
    widthCells: 2.5,
  },
] as const;

export function speedMultiplier(level: number): number {
  return 1 + (Math.max(1, level) - 1) * SPEED_SCALE;
}

export function densityMultiplier(level: number): number {
  return 1 / (1 + (Math.max(1, level) - 1) * DENSITY_SCALE);
}

export function laneSpeed(lane: LaneDef, level: number): number {
  return lane.baseSpeed * speedMultiplier(level) * lane.dir;
}

export function laneGaps(
  lane: LaneDef,
  level: number,
): { min: number; max: number } {
  const d = densityMultiplier(level);
  return { min: lane.gapMin * d, max: lane.gapMax * d };
}

export function isRoadLane(lane: LaneDef): lane is RoadLaneDef {
  return lane.kind === "road";
}

export function isRiverLane(lane: LaneDef): lane is RiverLaneDef {
  return lane.kind === "river";
}
