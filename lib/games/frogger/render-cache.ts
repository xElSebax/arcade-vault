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
import type { GameSkinId } from "@/lib/games/skins/types";
import type { FroggerSkinTokens } from "./skins";
import type { VehicleKind } from "./types";

const VEHICLE_HEIGHT = CELL * 0.62;
const FROG_BODY = CELL - 12;

const VEHICLE_WIDTH: Record<VehicleKind, number> = {
  car: 1.4 * CELL,
  truck: 2.2 * CELL,
  bus: 2.8 * CELL,
};

function rowY(row: number): number {
  return row * CELL;
}

function fillRow(ctx: CanvasRenderingContext2D, row: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, rowY(row), W, CELL);
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStaticTerrain(ctx: CanvasRenderingContext2D, skin: FroggerSkinTokens): void {
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
}

function buildScanlinePattern(
  ctx: CanvasRenderingContext2D,
  opacity: number,
): CanvasPattern | null {
  const tile = createCanvas(1, 2);
  const tileCtx = tile.getContext("2d");
  if (!tileCtx) return null;
  tileCtx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  tileCtx.fillRect(0, 1, 1, 1);
  return ctx.createPattern(tile, "repeat");
}

function buildGlowSprite(
  width: number,
  height: number,
  color: string,
  blur: number,
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(blur * 2);
  const canvas = createCanvas(width + pad * 2, height + pad * 2);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, pad };
  }
  spriteCtx.shadowColor = color;
  spriteCtx.shadowBlur = blur;
  spriteCtx.fillStyle = color;
  spriteCtx.fillRect(pad, pad, width, height);
  spriteCtx.shadowBlur = 0;
  return { canvas, pad };
}

function buildFrogGlowSprite(
  bodyColor: string,
  glowColor: string,
  blur: number,
): { canvas: HTMLCanvasElement; pad: number } {
  const width = FROG_BODY;
  const height = FROG_BODY;
  const pad = Math.ceil(blur * 2);
  const canvas = createCanvas(width + pad * 2, height + pad * 2);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, pad };
  }
  const cx = pad + width / 2;
  const cy = pad + height / 2;
  spriteCtx.shadowColor = glowColor;
  spriteCtx.shadowBlur = blur;
  spriteCtx.fillStyle = bodyColor;
  spriteCtx.beginPath();
  spriteCtx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.shadowBlur = 0;
  return { canvas, pad };
}

export class FroggerRenderCache {
  private skinId: GameSkinId | null = null;
  private staticLayer: HTMLCanvasElement | null = null;
  private scanlinePattern: CanvasPattern | null = null;
  private vehicleGlow = new Map<VehicleKind, { canvas: HTMLCanvasElement; pad: number }>();
  private frogGlow: { canvas: HTMLCanvasElement; pad: number } | null = null;

  ensure(ctx: CanvasRenderingContext2D, skinId: GameSkinId, skin: FroggerSkinTokens): void {
    if (this.skinId === skinId) return;
    this.invalidate();
    this.skinId = skinId;

    this.staticLayer = createCanvas(W, H);
    const staticCtx = this.staticLayer.getContext("2d");
    if (staticCtx) {
      drawStaticTerrain(staticCtx, skin);
    }

    if (skin.scanlineOpacity) {
      this.scanlinePattern = buildScanlinePattern(ctx, skin.scanlineOpacity);
    }

    if (skin.vehicleGlowBlur) {
      for (const kind of ["car", "truck", "bus"] as const) {
        const color =
          kind === "car" ? skin.car : kind === "truck" ? skin.truck : skin.bus;
        this.vehicleGlow.set(
          kind,
          buildGlowSprite(
            VEHICLE_WIDTH[kind],
            VEHICLE_HEIGHT,
            color,
            skin.vehicleGlowBlur,
          ),
        );
      }
    }

    if (skin.frogGlowBlur) {
      this.frogGlow = buildFrogGlowSprite(
        skin.frog,
        skin.frogGlow ?? skin.frog,
        skin.frogGlowBlur,
      );
    }
  }

  invalidate(): void {
    this.skinId = null;
    this.staticLayer = null;
    this.scanlinePattern = null;
    this.vehicleGlow.clear();
    this.frogGlow = null;
  }

  blitStaticLayer(ctx: CanvasRenderingContext2D): void {
    if (this.staticLayer) {
      ctx.drawImage(this.staticLayer, 0, 0);
    }
  }

  drawScanlines(ctx: CanvasRenderingContext2D): void {
    if (!this.scanlinePattern) return;
    ctx.save();
    ctx.fillStyle = this.scanlinePattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  drawVehicleGlow(
    ctx: CanvasRenderingContext2D,
    kind: VehicleKind,
    x: number,
    y: number,
  ): boolean {
    const sprite = this.vehicleGlow.get(kind);
    if (!sprite) return false;
    ctx.drawImage(sprite.canvas, x - sprite.pad, y - sprite.pad);
    return true;
  }

  drawFrogGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ): boolean {
    if (!this.frogGlow) return false;
    ctx.drawImage(this.frogGlow.canvas, x - this.frogGlow.pad, y - this.frogGlow.pad);
    return true;
  }
}

export function createFroggerRenderCache(): FroggerRenderCache {
  return new FroggerRenderCache();
}
