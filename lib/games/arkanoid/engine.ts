import {
  BLOCK_SCORE,
  EXPLOSION_DURATION,
  H,
  MAX_DT,
  PADDLE_SPEED,
  STARTING_LIVES,
  W,
} from "./constants";
import {
  createBallOnPaddle,
  type Ball,
} from "./entities/ball";
import {
  allBlocksDestroyed,
  type Block,
  spawnBlocks,
} from "./entities/block";
import { createExplosion, type Explosion } from "./entities/explosion";
import {
  createPaddle,
  type Paddle,
} from "./entities/paddle";
import { LEVELS } from "./levels";
import {
  drawFrame,
  drawSprite,
  EXPLOSION_FRAMES,
  loadSpritesheet,
  isSpritesheetReady,
} from "./spritesheet";
import type {
  ArkanoidEngine,
  ArkanoidGameState,
  ArkanoidPhase,
} from "./types";
import { clamp, collideAABB } from "./utils";

export function createArkanoidEngine(): ArkanoidEngine {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let paused = false;
  let mounted = false;
  let spritesReady = false;

  const keys: Record<string, boolean> = {};
  const stateListeners = new Set<(state: ArkanoidGameState) => void>();

  let paddle: Paddle = createPaddle();
  let ball: Ball = createBallOnPaddle(paddle, 1);
  let blocks: Block[] = [];
  let explosions: Explosion[] = [];
  let score = 0;
  let lives = STARTING_LIVES;
  let level = 1;
  let phase: ArkanoidPhase = "playing";

  function currentState(): ArkanoidGameState {
    return { score, lives, level, phase };
  }

  function emitState(): void {
    const state = currentState();
    for (const listener of stateListeners) {
      listener(state);
    }
  }

  function loadLevel(levelNum: number): void {
    level = levelNum;
    const levelDef = LEVELS[levelNum - 1];
    blocks = spawnBlocks(levelDef.blocks);
    explosions = [];
    ball = createBallOnPaddle(paddle, levelDef.speed);
    emitState();
  }

  function initBall(): void {
    const levelDef = LEVELS[level - 1];
    ball = createBallOnPaddle(paddle, levelDef.speed);
  }

  function initGame(): void {
    paddle = createPaddle();
    score = 0;
    lives = STARTING_LIVES;
    phase = "playing";
    loadLevel(1);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.code !== "ArrowLeft" && e.code !== "ArrowRight") return;
    e.preventDefault();
    keys[e.code] = true;
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.code !== "ArrowLeft" && e.code !== "ArrowRight") return;
    keys[e.code] = false;
  }

  function onMouseMove(e: MouseEvent): void {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = clamp(mouseX - paddle.w / 2, 0, W - paddle.w);
  }

  function update(dt: number): void {
    if (phase !== "playing") return;

    if (keys.ArrowLeft) {
      paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    }
    if (keys.ArrowRight) {
      paddle.x = Math.min(W - paddle.w, paddle.x + PADDLE_SPEED * dt);
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + ball.w >= W) {
      ball.x = W - ball.w;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
    }

    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
    }

    for (const block of blocks) {
      if (!block.alive) continue;
      if (collideAABB(ball, block)) {
        block.alive = false;
        explosions.push(createExplosion(block));
        score += BLOCK_SCORE;
        ball.vy = -ball.vy;
        if (allBlocksDestroyed(blocks)) {
          if (level < 5) {
            loadLevel(level + 1);
          } else {
            phase = "win";
            emitState();
          }
        } else {
          emitState();
        }
        break;
      }
    }

    for (const exp of explosions) {
      exp.elapsed += dt * 1000;
    }
    explosions = explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    if (ball.y > H) {
      lives--;
      if (lives <= 0) {
        lives = 0;
        phase = "gameover";
        emitState();
      } else {
        initBall();
        emitState();
      }
    }
  }

  function draw(): void {
    if (!ctx || !isSpritesheetReady()) return;
    const context = ctx;

    context.fillStyle = "#000";
    context.fillRect(0, 0, W, H);

    for (const block of blocks) {
      if (block.alive) {
        drawSprite(
          context,
          `block_${block.color}`,
          block.x,
          block.y,
          block.w,
          block.h,
        );
      }
    }

    for (const exp of explosions) {
      const frameIndex = Math.min(
        Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4),
        3,
      );
      drawFrame(
        context,
        EXPLOSION_FRAMES[exp.color][frameIndex],
        exp.x,
        exp.y,
        exp.w,
        exp.h,
      );
    }

    drawSprite(context, "paddle", paddle.x, paddle.y, paddle.w, paddle.h);
    drawSprite(context, "ball", ball.x, ball.y, ball.w, ball.h);
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
      spritesReady = false;

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      canvas.addEventListener("mousemove", onMouseMove);

      const begin = () => {
        spritesReady = true;
        initGame();
        startLoop();
      };

      if (isSpritesheetReady()) {
        begin();
      } else {
        loadSpritesheet(begin);
      }
    },

    unmount(): void {
      stopLoop();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (canvas) {
        canvas.removeEventListener("mousemove", onMouseMove);
      }

      for (const key of Object.keys(keys)) {
        delete keys[key];
      }

      canvas = null;
      ctx = null;
      mounted = false;
      paused = false;
      spritesReady = false;
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
      if (mounted && !paused && spritesReady) {
        draw();
      }
    },

    onStateChange(cb: (state: ArkanoidGameState) => void): () => void {
      stateListeners.add(cb);
      cb(currentState());
      return () => {
        stateListeners.delete(cb);
      };
    },
  };
}
