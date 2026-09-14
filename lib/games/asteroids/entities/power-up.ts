import { H, POWERUP_TTL, W } from "../constants";
import type { AsteroidsRenderCache } from "../render-cache";
import type { AsteroidsSkinTokens } from "../skins";
import { rand, wrap } from "../utils";

export class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl = POWERUP_TTL;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    tokens: AsteroidsSkinTokens,
    cache?: AsteroidsRenderCache,
  ): void {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    const r = this.radius * pulse;
    const angle = Math.PI / 4;

    if (tokens.glowBlur) {
      const usedCache = cache?.drawPowerUpGlow(
        ctx,
        this.x,
        this.y,
        angle,
        r / this.radius,
      );
      if (!usedCache) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        ctx.strokeStyle = tokens.powerUp;
        ctx.lineWidth = 2;
        ctx.shadowBlur = tokens.glowBlur;
        ctx.shadowColor = tokens.powerUp;
        ctx.strokeRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.strokeStyle = tokens.powerUp;
    ctx.lineWidth = 2;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = tokens.powerUp;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
    ctx.restore();
  }
}
