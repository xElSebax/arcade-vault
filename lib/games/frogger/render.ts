import { CELL, HOME_ROW } from "./constants";
import { frogPixel, type Frog } from "./entities/frog";
import type { Home } from "./entities/home";
import { isPlatformRideable, type Platform } from "./entities/platform";
import type { Vehicle } from "./entities/vehicle";
import type { FroggerRenderCache } from "./render-cache";
import type { FroggerSkinTokens } from "./skins";
import type { GameSkinId } from "@/lib/games/skins/types";

export interface RenderWorld {
  frog: Frog;
  vehicles: Vehicle[];
  platforms: Platform[];
  homes: Home[];
}

function drawHomes(
  ctx: CanvasRenderingContext2D,
  homes: Home[],
  skin: FroggerSkinTokens,
): void {
  for (const home of homes) {
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
}

function drawPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  skin: FroggerSkinTokens,
): void {
  for (const platform of platforms) {
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
}

function drawVehicleDetails(
  ctx: CanvasRenderingContext2D,
  vehicle: Vehicle,
  skin: FroggerSkinTokens,
  includeBody: boolean,
): void {
  const color =
    vehicle.kind === "car"
      ? skin.car
      : vehicle.kind === "truck"
        ? skin.truck
        : skin.bus;

  if (includeBody) {
    ctx.fillStyle = color;
    ctx.fillRect(vehicle.x, vehicle.y, vehicle.w, vehicle.h);
  }

  ctx.fillStyle = skin.vehicleCabin;
  ctx.fillRect(vehicle.x + 4, vehicle.y + 4, vehicle.w * 0.28, vehicle.h - 8);
  ctx.fillStyle = skin.vehicleWheel;
  ctx.fillRect(vehicle.x + 6, vehicle.y + vehicle.h - 6, 8, 4);
  ctx.fillRect(vehicle.x + vehicle.w - 14, vehicle.y + vehicle.h - 6, 8, 4);
}

function drawVehicles(
  ctx: CanvasRenderingContext2D,
  vehicles: Vehicle[],
  skin: FroggerSkinTokens,
  cache: FroggerRenderCache,
): void {
  ctx.shadowBlur = 0;
  for (const vehicle of vehicles) {
    const usedGlowSprite = cache.drawVehicleGlow(
      ctx,
      vehicle.kind,
      vehicle.x,
      vehicle.y,
    );
    drawVehicleDetails(ctx, vehicle, skin, !usedGlowSprite);
  }
}

function drawFrog(
  ctx: CanvasRenderingContext2D,
  frog: Frog,
  skin: FroggerSkinTokens,
  cache: FroggerRenderCache,
): void {
  const frogBox = frogPixel(frog);
  ctx.shadowBlur = 0;

  const usedGlowSprite = cache.drawFrogGlow(ctx, frogBox.x, frogBox.y);
  if (!usedGlowSprite) {
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
  }

  ctx.fillStyle = skin.frogEye;
  ctx.fillRect(frogBox.x + frogBox.w * 0.28, frogBox.y + frogBox.h * 0.28, 4, 4);
  ctx.fillRect(frogBox.x + frogBox.w * 0.62, frogBox.y + frogBox.h * 0.28, 4, 4);
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  world: RenderWorld,
  skinId: GameSkinId,
  skin: FroggerSkinTokens,
  cache: FroggerRenderCache,
): void {
  cache.ensure(ctx, skinId, skin);
  cache.blitStaticLayer(ctx);
  drawHomes(ctx, world.homes, skin);
  drawPlatforms(ctx, world.platforms, skin);
  drawVehicles(ctx, world.vehicles, skin, cache);
  drawFrog(ctx, world.frog, skin, cache);
  cache.drawScanlines(ctx);
}
