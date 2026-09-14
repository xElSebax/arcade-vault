import { H, W } from "./constants";
import type { Asteroid } from "./entities/asteroid";
import type { AsteroidsSkinTokens } from "./skins";
import type { GameSkinId } from "@/lib/games/skins/types";

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawStaticBackground(
  ctx: CanvasRenderingContext2D,
  skin: AsteroidsSkinTokens,
): void {
  ctx.fillStyle = skin.background;
  ctx.fillRect(0, 0, W, H);

  if (!skin.grid) return;

  const step = 40;
  ctx.strokeStyle = skin.grid;
  ctx.lineWidth = skin.gridLineWidth ?? 1;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function buildStrokeGlowSprite(
  drawPath: (ctx: CanvasRenderingContext2D) => void,
  halfExtent: number,
  color: string,
  blur: number,
  lineWidth: number,
): { canvas: HTMLCanvasElement; offset: number } {
  const pad = Math.ceil(blur * 2) + 2;
  const size = Math.ceil(halfExtent * 2 + pad * 2);
  const canvas = createCanvas(size, size);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, offset: halfExtent + pad };
  }

  const cx = size / 2;
  const cy = size / 2;
  spriteCtx.translate(cx, cy);
  spriteCtx.strokeStyle = color;
  spriteCtx.lineWidth = lineWidth;
  spriteCtx.lineJoin = "round";
  spriteCtx.shadowColor = color;
  spriteCtx.shadowBlur = blur;
  drawPath(spriteCtx);
  spriteCtx.shadowBlur = 0;

  return { canvas, offset: halfExtent + pad };
}

function buildCircleGlowSprite(
  radius: number,
  color: string,
  blur: number,
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(blur * 2) + 2;
  const size = Math.ceil((radius + pad) * 2);
  const canvas = createCanvas(size, size);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, pad };
  }
  const cx = size / 2;
  const cy = size / 2;
  spriteCtx.shadowColor = color;
  spriteCtx.shadowBlur = blur;
  spriteCtx.fillStyle = color;
  spriteCtx.beginPath();
  spriteCtx.arc(cx, cy, radius + 0.5, 0, Math.PI * 2);
  spriteCtx.fill();
  spriteCtx.shadowBlur = 0;
  return { canvas, pad: size / 2 };
}

function buildAsteroidGlowSprite(
  asteroid: Asteroid,
  color: string,
  blur: number,
): { canvas: HTMLCanvasElement; offset: number } | null {
  let maxR = 0;
  for (const [vx, vy] of asteroid.verts) {
    maxR = Math.max(maxR, Math.hypot(vx, vy));
  }
  return buildStrokeGlowSprite(
    (ctx) => {
      ctx.beginPath();
      ctx.moveTo(asteroid.verts[0][0], asteroid.verts[0][1]);
      for (let i = 1; i < asteroid.verts.length; i++) {
        ctx.lineTo(asteroid.verts[i][0], asteroid.verts[i][1]);
      }
      ctx.closePath();
      ctx.stroke();
    },
    maxR + 2,
    color,
    blur,
    1.5,
  );
}

export class AsteroidsRenderCache {
  private skinId: GameSkinId | null = null;
  private staticLayer: HTMLCanvasElement | null = null;
  private shipGlow: { canvas: HTMLCanvasElement; offset: number } | null = null;
  private bulletGlow: { canvas: HTMLCanvasElement; pad: number } | null = null;
  private powerUpGlow: { canvas: HTMLCanvasElement; offset: number } | null = null;
  private particleGlow: { canvas: HTMLCanvasElement; pad: number } | null = null;
  private asteroidGlow = new WeakMap<
    Asteroid,
    { canvas: HTMLCanvasElement; offset: number }
  >();

  ensure(
    ctx: CanvasRenderingContext2D,
    skinId: GameSkinId,
    skin: AsteroidsSkinTokens,
  ): void {
    if (this.skinId === skinId) return;
    this.invalidate();
    this.skinId = skinId;

    this.staticLayer = createCanvas(W, H);
    const staticCtx = this.staticLayer.getContext("2d");
    if (staticCtx) {
      drawStaticBackground(staticCtx, skin);
    }

    if (!skin.glowBlur) return;

    this.shipGlow = buildStrokeGlowSprite(
      (sctx) => {
        sctx.beginPath();
        sctx.moveTo(20, 0);
        sctx.lineTo(-12, -9);
        sctx.lineTo(-7, 0);
        sctx.lineTo(-12, 9);
        sctx.closePath();
        sctx.stroke();
      },
      22,
      skin.ship,
      skin.glowBlur,
      1.5,
    );

    this.bulletGlow = buildCircleGlowSprite(2.5, skin.bullet, skin.glowBlur);

    this.powerUpGlow = buildStrokeGlowSprite(
      (sctx) => {
        const r = 12;
        sctx.strokeRect(-r, -r, r * 2, r * 2);
      },
      14,
      skin.powerUp,
      skin.glowBlur,
      2,
    );

    const particleBlur =
      skin.particleGlowBlur ?? Math.round(skin.glowBlur * 0.5);
    this.particleGlow = buildCircleGlowSprite(1.5, skin.bullet, particleBlur);
  }

  invalidate(): void {
    this.skinId = null;
    this.staticLayer = null;
    this.shipGlow = null;
    this.bulletGlow = null;
    this.powerUpGlow = null;
    this.particleGlow = null;
    this.asteroidGlow = new WeakMap();
  }

  blitStaticLayer(ctx: CanvasRenderingContext2D): void {
    if (this.staticLayer) {
      ctx.drawImage(this.staticLayer, 0, 0);
    }
  }

  drawShipGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
  ): boolean {
    if (!this.shipGlow) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(
      this.shipGlow.canvas,
      -this.shipGlow.offset,
      -this.shipGlow.offset,
    );
    ctx.restore();
    return true;
  }

  drawBulletGlow(ctx: CanvasRenderingContext2D, x: number, y: number): boolean {
    if (!this.bulletGlow) return false;
    ctx.drawImage(
      this.bulletGlow.canvas,
      x - this.bulletGlow.pad,
      y - this.bulletGlow.pad,
    );
    return true;
  }

  drawPowerUpGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    scale: number,
  ): boolean {
    if (!this.powerUpGlow) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.drawImage(
      this.powerUpGlow.canvas,
      -this.powerUpGlow.offset,
      -this.powerUpGlow.offset,
    );
    ctx.restore();
    return true;
  }

  drawParticleGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    alpha: number,
  ): boolean {
    if (!this.particleGlow) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(
      this.particleGlow.canvas,
      x - this.particleGlow.pad,
      y - this.particleGlow.pad,
    );
    ctx.restore();
    return true;
  }

  drawAsteroidGlow(
    ctx: CanvasRenderingContext2D,
    asteroid: Asteroid,
    tokens: AsteroidsSkinTokens,
  ): boolean {
    if (!tokens.glowBlur) return false;

    let sprite = this.asteroidGlow.get(asteroid);
    if (!sprite) {
      const built = buildAsteroidGlowSprite(
        asteroid,
        tokens.asteroid,
        tokens.glowBlur,
      );
      if (!built) return false;
      sprite = built;
      this.asteroidGlow.set(asteroid, sprite);
    }

    ctx.save();
    ctx.translate(asteroid.x, asteroid.y);
    ctx.rotate(asteroid.rot);
    ctx.drawImage(sprite.canvas, -sprite.offset, -sprite.offset);
    ctx.restore();
    return true;
  }
}

export function createAsteroidsRenderCache(): AsteroidsRenderCache {
  return new AsteroidsRenderCache();
}
