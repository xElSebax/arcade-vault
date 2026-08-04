import {
  H,
  MAX_DT,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  W,
} from "./constants";
import { Asteroid } from "./entities/asteroid";
import { Bullet } from "./entities/bullet";
import { Particle } from "./entities/particle";
import { PowerUp } from "./entities/power-up";
import { Ship } from "./entities/ship";
import type {
  AsteroidsEngine,
  AsteroidsGameState,
  AsteroidsPhase,
} from "./types";
import { dist, rand } from "./utils";

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
]);

const SAFE_DIST = 130;

export function createAsteroidsEngine(): AsteroidsEngine {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let paused = false;
  let mounted = false;

  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  const stateListeners = new Set<(state: AsteroidsGameState) => void>();

  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = 3;
  let level = 1;
  let phase: AsteroidsPhase = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;

  function currentState(): AsteroidsGameState {
    return { score, lives, level, phase };
  }

  function emitState(): void {
    const state = currentState();
    for (const listener of stateListeners) {
      listener(state);
    }
  }

  function pressed(code: string): boolean {
    const val = justPressed[code];
    justPressed[code] = false;
    return !!val;
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (GAME_KEYS.has(e.code)) {
      e.preventDefault();
    }
    if (!keys[e.code]) {
      justPressed[e.code] = true;
    }
    keys[e.code] = true;
  }

  function onKeyUp(e: KeyboardEvent): void {
    keys[e.code] = false;
  }

  function spawnAsteroids(count: number): void {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function explode(x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y));
    }
  }

  function initGame(): void {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    score = 0;
    lives = 3;
    level = 1;
    phase = "playing";
    deadTimer = 0;
    spawnAsteroids(4);
    emitState();
  }

  function nextLevel(): void {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
    emitState();
  }

  function killShip(): void {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    lives--;
    if (lives <= 0) {
      phase = "gameover";
    } else {
      phase = "dead";
      deadTimer = 2;
    }
    emitState();
  }

  function syncShipInput(): void {
    ship.input = {
      left: !!keys.ArrowLeft,
      right: !!keys.ArrowRight,
      thrust: !!keys.ArrowUp,
    };
  }

  function update(dt: number): void {
    if (phase === "gameover") {
      return;
    }

    if (phase === "dead") {
      deadTimer -= dt;
      particles.forEach((p) => p.update(dt));
      particles = particles.filter((p) => !p.dead);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        phase = "playing";
        ship.reset();
        emitState();
      }
      return;
    }

    syncShipInput();

    if (pressed("Space")) {
      bullets.push(...ship.tryShoot());
    }

    ship.update(dt);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));

    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);

    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }

    const newAsteroids: Asteroid[] = [];
    let scoreChanged = false;

    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          score += POINTS[a.size];
          scoreChanged = true;
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }

    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);

    if (scoreChanged) {
      emitState();
    }

    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }

    if (asteroids.length === 0) {
      nextLevel();
    }
  }

  function drawLifeIcon(x: number, y: number): void {
    if (!ctx) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function drawHUD(): void {
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.font = "15px monospace";

    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${score}`, 14, 26);

    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${level}`, W / 2, 26);

    for (let i = 0; i < lives; i++) {
      drawLifeIcon(W - 16 - i * 22, 18);
    }

    if (ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }

  function draw(): void {
    if (!ctx) return;
    const context = ctx;

    context.fillStyle = "#000";
    context.fillRect(0, 0, W, H);

    particles.forEach((p) => p.draw(context));
    asteroids.forEach((a) => a.draw(context));
    powerUps.forEach((p) => p.draw(context));
    bullets.forEach((b) => b.draw(context));
    ship.draw(context);

    drawHUD();
  }

  function loop(ts: number): void {
    if (!mounted || paused) return;

    const dt =
      lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    lastTime = null;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = null;
  }

  return {
    mount(targetCanvas: HTMLCanvasElement): void {
      if (mounted) {
        this.unmount();
      }

      canvas = targetCanvas;
      ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get 2D rendering context");
      }

      mounted = true;
      paused = false;
      initGame();

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);

      startLoop();
    },

    unmount(): void {
      stopLoop();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);

      for (const key of Object.keys(keys)) {
        delete keys[key];
      }
      for (const key of Object.keys(justPressed)) {
        delete justPressed[key];
      }

      canvas = null;
      ctx = null;
      mounted = false;
      paused = false;
    },

    pause(): void {
      if (!mounted || paused) return;
      paused = true;
      stopLoop();
    },

    resume(): void {
      if (!mounted || !paused) return;
      paused = false;
      startLoop();
    },

    reset(): void {
      initGame();
      if (mounted && !paused) {
        draw();
      }
    },

    onStateChange(cb: (state: AsteroidsGameState) => void): () => void {
      stateListeners.add(cb);
      cb(currentState());
      return () => {
        stateListeners.delete(cb);
      };
    },
  };
}
