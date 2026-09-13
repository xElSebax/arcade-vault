import { HOME_ROW, RIVER_ROWS } from "./constants";
import { frogPixel, isHopping, type Frog } from "./entities/frog";
import { homeAtCol, type Home } from "./entities/home";
import {
  isPlatformRideable,
  type Platform,
} from "./entities/platform";
import type { Vehicle } from "./entities/vehicle";

export interface Aabb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function aabbOverlap(a: Aabb, b: Aabb): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function hitsVehicle(frog: Frog, vehicles: Vehicle[]): boolean {
  if (isHopping(frog)) return false;
  const box = frogPixel(frog);
  return vehicles.some((vehicle) => aabbOverlap(box, vehicle));
}

export function ridingPlatform(frog: Frog, platforms: Platform[]): Platform | null {
  if (isHopping(frog)) return null;
  const box = frogPixel(frog);
  const hit = platforms.find(
    (platform) => isPlatformRideable(platform) && aabbOverlap(box, platform),
  );
  return hit ?? null;
}

export function isInRiver(frog: Frog): boolean {
  const row = Math.round(frog.row);
  return (RIVER_ROWS as readonly number[]).includes(row);
}

export function drowned(frog: Frog, platforms: Platform[]): boolean {
  if (isHopping(frog)) return false;
  if (!isInRiver(frog)) return false;
  return ridingPlatform(frog, platforms) === null;
}

export function landedHome(frog: Frog, homes: Home[]): Home | "miss" | null {
  if (isHopping(frog)) return null;
  if (Math.round(frog.row) !== HOME_ROW) return null;
  const col = Math.round(frog.col);
  const home = homeAtCol(homes, col);
  if (!home) return "miss";
  if (home.occupied) return "miss";
  return home;
}
