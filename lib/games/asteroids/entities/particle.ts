import type { AsteroidsSkinTokens } from "../skins";
import { rand } from "../utils";

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, tokens: AsteroidsSkinTokens): void {
    const alpha = this.ttl / this.life;
    const [r, g, b] = tokens.particleRgb;
    const color = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const particleGlow =
      tokens.particleGlowBlur ??
      (tokens.glowBlur ? Math.round(tokens.glowBlur * 0.5) : 0);
    if (particleGlow > 0) {
      ctx.shadowBlur = particleGlow;
      ctx.shadowColor = color;
    }

    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.restore();
  }
}
