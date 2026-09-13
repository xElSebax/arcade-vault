import {
  CELL,
  COLS,
  DOCK_ROW,
  H,
  HOME_ROW,
  MEDIAN_ROW,
  RIVER_ROWS,
  ROAD_ROWS,
  W,
} from "./constants";
import { frogPixel, type Frog } from "./entities/frog";
import type { Home } from "./entities/home";
import { isPlatformRideable, type Platform } from "./entities/platform";
import type { Vehicle } from "./entities/vehicle";
import type { FroggerSkinTokens } from "./skins";

export interface RenderWorld {
  frog: Frog;
  vehicles: Vehicle[];
  platforms: Platform[];
  homes: Home[];
}

function rowY(row: number): number {
  return row * CELL;
}

function fillRow(ctx: CanvasRenderingContext2D, row: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, rowY(row), W, CELL);
}

function drawScanlines(
  ctx: CanvasRenderingContext2D,
  opacity: number,
): void {
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: RenderWorld,
  skin: FroggerSkinTokens,
): void {
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, W, H);

  for (let row = 0; row < HOME_ROW; row++) {
    fillRow(ctx, row, skin.grass);
  }
  fillRow(ctx, HOME_ROW, skin.grass);

  for (const row of RIVER_ROWS) {
    fillRow(ctx, row, skin.river);
    ctx.fillStyle = skin.riverHighlight;
    ctx.fillRect(0, rowY(row) + CELL * 0.15, W, 2);
    ctx.fillRect(0, rowY(row) + CELL * 0.7, W, 2);
  }

  fillRow(ctx, MEDIAN_ROW, skin.grass);
  ctx.fillStyle = skin.medianLine;
  ctx.fillRect(0, rowY(MEDIAN_ROW) + CELL / 2 - 1, W, 2);

  for (const row of ROAD_ROWS) {
    fillRow(ctx, row, skin.asphalt);
    ctx.fillStyle = skin.roadDash;
    const dashY = rowY(row) + CELL - 3;
    for (let x = 8; x < W; x += 28) {
      ctx.fillRect(x, dashY, 14, 2);
    }
  }

  fillRow(ctx, DOCK_ROW, skin.grass);

  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL + 0.5, 0);
    ctx.lineTo(c * CELL + 0.5, H);
    ctx.stroke();
  }

  for (const home of world.homes) {
    const x = home.col * CELL + 4;
    const y = HOME_ROW * CELL + 4;
    ctx.fillStyle = home.occupied ? skin.homeOccupied : skin.home;
    ctx.beginPath();
    ctx.ellipse(x + (CELL - 8) / 2, y + (CELL - 8) / 2, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = home.occupied ? skin.homeOccupiedStroke : skin.homeStroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  for (const platform of world.platforms) {
    if (platform.kind === "turtle" && !isPlatformRideable(platform)) {
      ctx.fillStyle = skin.turtleSunk;
      ctx.fillRect(platform.x, platform.y + platform.h * 0.45, platform.w, platform.h * 0.25);
      continue;
    }
    if (platform.kind === "log") {
      ctx.fillStyle = skin.log;
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = skin.logHighlight;
      ctx.fillRect(platform.x + 4, platform.y + 4, platform.w - 8, 4);
    } else {
      ctx.fillStyle = skin.turtle;
      const shells = Math.max(1, Math.round(platform.w / CELL));
      for (let i = 0; i < shells; i++) {
        const cx = platform.x + (i + 0.5) * (platform.w / shells);
        ctx.beginPath();
        ctx.ellipse(cx, platform.y + platform.h / 2, CELL * 0.38, platform.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for (const vehicle of world.vehicles) {
    const color =
      vehicle.kind === "car"
        ? skin.car
        : vehicle.kind === "truck"
          ? skin.truck
          : skin.bus;
    if (skin.vehicleGlowBlur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = skin.vehicleGlowBlur;
    }
    ctx.fillStyle = color;
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.w, vehicle.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.vehicleCabin;
    ctx.fillRect(vehicle.x + 4, vehicle.y + 4, vehicle.w * 0.28, vehicle.h - 8);
    ctx.fillStyle = skin.vehicleWheel;
    ctx.fillRect(vehicle.x + 6, vehicle.y + vehicle.h - 6, 8, 4);
    ctx.fillRect(vehicle.x + vehicle.w - 14, vehicle.y + vehicle.h - 6, 8, 4);
  }

  const frogBox = frogPixel(world.frog);
  if (skin.frogGlowBlur) {
    ctx.shadowColor = skin.frogGlow ?? skin.frog;
    ctx.shadowBlur = skin.frogGlowBlur;
  }
  ctx.fillStyle = skin.frog;
  ctx.beginPath();
  ctx.ellipse(
    frogBox.x + frogBox.w / 2,
    frogBox.y + frogBox.h / 2,
    frogBox.w / 2,
    frogBox.h / 2,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = skin.frogEye;
  ctx.fillRect(frogBox.x + frogBox.w * 0.28, frogBox.y + frogBox.h * 0.28, 4, 4);
  ctx.fillRect(frogBox.x + frogBox.w * 0.62, frogBox.y + frogBox.h * 0.28, 4, 4);

  if (skin.scanlineOpacity) {
    drawScanlines(ctx, skin.scanlineOpacity);
  }
}
