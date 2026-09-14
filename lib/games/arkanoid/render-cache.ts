import {
  BLOCK_COLS,
  BLOCK_H,
  BLOCK_ROWS,
  BLOCK_W,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
  H,
  W,
} from "./constants";
import type { GameSkinId } from "@/lib/games/skins/types";
import {
  EXPLOSION_FRAMES,
  getSpritesheetCanvas,
  SPRITES,
  type SpriteFrame,
  type SpriteDrawOptions,
} from "./spritesheet";
import type { ArkanoidSkinTokens } from "./skins";
import type { BlockColor } from "./types";
import { BALL_H, BALL_W } from "./entities/ball";
import { PADDLE_H, PADDLE_W } from "./entities/paddle";

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawGridOnContext(
  context: CanvasRenderingContext2D,
  color: string,
  alpha: number,
): void {
  context.strokeStyle = color;
  context.lineWidth = 1;
  context.globalAlpha = alpha;

  for (let col = 0; col <= BLOCK_COLS; col++) {
    const x = BLOCKS_ORIGIN_X + col * BLOCK_W;
    context.beginPath();
    context.moveTo(x, BLOCKS_ORIGIN_Y);
    context.lineTo(x, BLOCKS_ORIGIN_Y + BLOCK_ROWS * BLOCK_H);
    context.stroke();
  }

  for (let row = 0; row <= BLOCK_ROWS; row++) {
    const y = BLOCKS_ORIGIN_Y + row * BLOCK_H;
    context.beginPath();
    context.moveTo(BLOCKS_ORIGIN_X, y);
    context.lineTo(BLOCKS_ORIGIN_X + BLOCK_COLS * BLOCK_W, y);
    context.stroke();
  }

  context.globalAlpha = 1;
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

function applyDrawOptions(
  ctx: CanvasRenderingContext2D,
  options?: SpriteDrawOptions,
): void {
  if (options?.filter && options.filter !== "none") {
    ctx.filter = options.filter;
  }
  if (options?.glowBlur) {
    ctx.shadowBlur = options.glowBlur;
    ctx.shadowColor = options.glowColor ?? "rgba(0, 245, 255, 0.85)";
  }
}

function resetDrawOptions(ctx: CanvasRenderingContext2D): void {
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

function buildGlowFromFrame(
  sheet: HTMLCanvasElement,
  frame: SpriteFrame,
  destW: number,
  destH: number,
  options: SpriteDrawOptions,
): { canvas: HTMLCanvasElement; pad: number } | null {
  const blur = options.glowBlur ?? 0;
  if (blur <= 0) return null;

  const pad = Math.ceil(blur * 2);
  const canvas = createCanvas(destW + pad * 2, destH + pad * 2);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) return null;

  applyDrawOptions(spriteCtx, options);
  spriteCtx.drawImage(
    sheet,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    pad,
    pad,
    destW,
    destH,
  );
  resetDrawOptions(spriteCtx);
  return { canvas, pad };
}

type GlowKey = "paddle" | "ball" | `explosion:${BlockColor}:${number}`;

export class ArkanoidRenderCache {
  private skinId: GameSkinId | null = null;
  private staticLayer: HTMLCanvasElement | null = null;
  private scanlinePattern: CanvasPattern | null = null;
  private glowSprites = new Map<GlowKey, { canvas: HTMLCanvasElement; pad: number }>();

  ensure(
    ctx: CanvasRenderingContext2D,
    skinId: GameSkinId,
    skin: ArkanoidSkinTokens,
  ): void {
    if (this.skinId === skinId) return;
    this.invalidate();
    this.skinId = skinId;

    this.staticLayer = createCanvas(W, H);
    const staticCtx = this.staticLayer.getContext("2d");
    if (staticCtx) {
      staticCtx.fillStyle = skin.background;
      staticCtx.fillRect(0, 0, W, H);
      if (skin.grid) {
        drawGridOnContext(staticCtx, skin.grid, skin.gridAlpha ?? 0.35);
      }
    }

    if (skin.scanlineAlpha) {
      this.scanlinePattern = buildScanlinePattern(ctx, skin.scanlineAlpha);
    }

    const sheet = getSpritesheetCanvas();
    if (!sheet) return;

    const paddleGlowBlur = skin.paddleGlowBlur ?? skin.entityGlowBlur;
    if (paddleGlowBlur) {
      const glow = buildGlowFromFrame(
        sheet,
        SPRITES.paddle,
        PADDLE_W,
        PADDLE_H,
        {
          filter: skin.spriteFilter,
          glowBlur: paddleGlowBlur,
          glowColor: skin.paddleGlowColor ?? skin.entityGlowColor,
        },
      );
      if (glow) this.glowSprites.set("paddle", glow);
    }

    const ballGlowBlur = skin.ballGlowBlur ?? skin.entityGlowBlur;
    if (ballGlowBlur) {
      const glow = buildGlowFromFrame(
        sheet,
        SPRITES.ball,
        BALL_W,
        BALL_H,
        {
          filter: skin.spriteFilter,
          glowBlur: ballGlowBlur,
          glowColor: skin.ballGlowColor ?? skin.entityGlowColor,
        },
      );
      if (glow) this.glowSprites.set("ball", glow);
    }

    const explosionBlur = skin.explosionGlowBlur;
    if (explosionBlur) {
      for (const color of Object.keys(EXPLOSION_FRAMES) as BlockColor[]) {
        const frames = EXPLOSION_FRAMES[color];
        for (let i = 0; i < frames.length; i++) {
          const glowColor =
            skin.explosionGlowColors?.[color] ?? skin.entityGlowColor;
          const glow = buildGlowFromFrame(
            sheet,
            frames[i],
            32,
            16,
            {
              filter: skin.blockFilters?.[color] ?? skin.spriteFilter,
              glowBlur: explosionBlur,
              glowColor,
            },
          );
          if (glow) {
            this.glowSprites.set(`explosion:${color}:${i}`, glow);
          }
        }
      }
    }
  }

  invalidate(): void {
    this.skinId = null;
    this.staticLayer = null;
    this.scanlinePattern = null;
    this.glowSprites.clear();
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

  drawGlow(
    ctx: CanvasRenderingContext2D,
    key: GlowKey,
    x: number,
    y: number,
  ): boolean {
    const sprite = this.glowSprites.get(key);
    if (!sprite) return false;
    ctx.drawImage(sprite.canvas, x - sprite.pad, y - sprite.pad);
    return true;
  }
}

export function createArkanoidRenderCache(): ArkanoidRenderCache {
  return new ArkanoidRenderCache();
}
