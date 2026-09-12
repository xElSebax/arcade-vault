import { H, W } from "../constants";
import type { AsteroidsSkinTokens } from "../skins";
import { wrap } from "../utils";

const BULLET_SPEED = 520;
const BULLET_TTL = 1.1;

export class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  radius: number;
  dead: boolean;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.ttl = BULLET_TTL;
    this.radius = 2;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, tokens: AsteroidsSkinTokens): void {
    ctx.save();
    ctx.fillStyle = tokens.bullet;

    if (tokens.glowBlur) {
      ctx.shadowBlur = tokens.glowBlur;
      ctx.shadowColor = tokens.bullet;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
