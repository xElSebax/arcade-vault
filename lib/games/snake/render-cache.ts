import { CELL, COLS, H, ROWS, W } from "./constants";
import type { GameSkinId } from "@/lib/games/skins/types";
import type { SnakeSkinTokens } from "./skins";

const BODY_PAD = 3;
const BODY_SIZE = CELL - BODY_PAD * 2;
const HEAD_PAD = 2;
const HEAD_SIZE = CELL - HEAD_PAD * 2;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStaticBackground(ctx: CanvasRenderingContext2D, skin: SnakeSkinTokens): void {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = 0.5;
  for (let col = 1; col < COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * CELL, 0);
    ctx.lineTo(col * CELL, H);
    ctx.stroke();
  }
  for (let row = 1; row < ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(W, row * CELL);
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

function buildSegmentGlowSprite(
  size: number,
  fillColor: string,
  glowColor: string,
  blur: number,
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(blur * 2);
  const canvas = createCanvas(size + pad * 2, size + pad * 2);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, pad };
  }
  spriteCtx.shadowColor = glowColor;
  spriteCtx.shadowBlur = blur;
  spriteCtx.fillStyle = fillColor;
  spriteCtx.fillRect(pad, pad, size, size);
  spriteCtx.shadowBlur = 0;
  return { canvas, pad };
}

export class SnakeRenderCache {
  private skinId: GameSkinId | null = null;
  private staticLayer: HTMLCanvasElement | null = null;
  private scanlinePattern: CanvasPattern | null = null;
  private bodyGlow: { canvas: HTMLCanvasElement; pad: number } | null = null;
  private headGlow: { canvas: HTMLCanvasElement; pad: number } | null = null;

  ensure(ctx: CanvasRenderingContext2D, skinId: GameSkinId, skin: SnakeSkinTokens): void {
    if (this.skinId === skinId) return;
    this.invalidate();
    this.skinId = skinId;

    this.staticLayer = createCanvas(W, H);
    const staticCtx = this.staticLayer.getContext("2d");
    if (staticCtx) {
      drawStaticBackground(staticCtx, skin);
    }

    if (skin.scanlineOpacity) {
      this.scanlinePattern = buildScanlinePattern(ctx, skin.scanlineOpacity);
    }

    const bodyBlur = skin.glowBlur ?? 5;
    this.bodyGlow = buildSegmentGlowSprite(
      BODY_SIZE,
      skin.body,
      skin.bodyGlow,
      bodyBlur,
    );

    const headBlur = skin.headGlowBlur ?? skin.glowBlur ?? 10;
    this.headGlow = buildSegmentGlowSprite(
      HEAD_SIZE,
      skin.head,
      skin.bodyGlow,
      headBlur,
    );
  }

  invalidate(): void {
    this.skinId = null;
    this.staticLayer = null;
    this.scanlinePattern = null;
    this.bodyGlow = null;
    this.headGlow = null;
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

  drawBodyGlow(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    if (!this.bodyGlow) return false;
    ctx.drawImage(this.bodyGlow.canvas, x - this.bodyGlow.pad, y - this.bodyGlow.pad);
    return true;
  }

  drawHeadGlow(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    if (!this.headGlow) return false;
    ctx.drawImage(this.headGlow.canvas, x - this.headGlow.pad, y - this.headGlow.pad);
    return true;
  }
}

export function createSnakeRenderCache(): SnakeRenderCache {
  return new SnakeRenderCache();
}
