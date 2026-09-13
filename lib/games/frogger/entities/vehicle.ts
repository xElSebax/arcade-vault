import { CELL } from "../constants";
import type { VehicleKind } from "../types";

export interface Vehicle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  kind: VehicleKind;
  row: number;
}

export function createVehicle(opts: {
  x: number;
  row: number;
  vx: number;
  kind: VehicleKind;
  widthCells: number;
}): Vehicle {
  const h = CELL * 0.62;
  return {
    x: opts.x,
    y: opts.row * CELL + (CELL - h) / 2,
    w: opts.widthCells * CELL,
    h,
    vx: opts.vx,
    kind: opts.kind,
    row: opts.row,
  };
}

export function updateVehicle(vehicle: Vehicle, dt: number, worldW: number): void {
  vehicle.x += vehicle.vx * dt;
  if (vehicle.vx > 0 && vehicle.x > worldW) {
    vehicle.x = -vehicle.w;
  } else if (vehicle.vx < 0 && vehicle.x + vehicle.w < 0) {
    vehicle.x = worldW;
  }
}
