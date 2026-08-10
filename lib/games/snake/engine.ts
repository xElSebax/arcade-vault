import {
  H,
  INITIAL_SNAKE_LENGTH,
  POINTS_PER_FRUIT,
  SPEED_INITIAL,
  W,
} from "./constants";
import { FRUITS_IMAGE_SRC } from "./sprites";
import type { SnakeEngine, SnakeGameState, SnakePhase } from "./types";
import {
  createInitialSnake,
  directionFromKey,
  isWallCollision,
  resolveDirection,
  spawnFruit,
  speedAfterFruits,
  type Direction,
  type Fruit,
  type Vec2,
} from "./utils";

const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d",
  "W",
  "A",
  "S",
  "D",
]);

const INITIAL_DIRECTION: Direction = { x: 1, y: 0 };

function willHitBody(head: Vec2, snake: Vec2[], growing: boolean): boolean {
  const limit = growing ? snake.length : snake.length - 1;
  for (let i = 1; i < limit; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) return true;
  }
  return false;
}

export function createSnakeEngine(): SnakeEngine {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let tickAccum = 0;
  let paused = false;
  let mounted = false;
  let imageReady = false;

  const stateListeners = new Set<(state: SnakeGameState) => void>();

  let snake: Vec2[] = createInitialSnake(INITIAL_SNAKE_LENGTH);
  let direction: Direction = { ...INITIAL_DIRECTION };
  let nextDirection: Direction = { ...INITIAL_DIRECTION };
  let fruit: Fruit | null = null;
  let score = 0;
  let fruitsEaten = 0;
  let moveInterval = SPEED_INITIAL;
  let phase: SnakePhase = "playing";

  function currentState(): SnakeGameState {
    return {
      score,
      length: snake.length,
      speed: moveInterval,
      phase,
    };
  }

  function emitState(): void {
    const state = currentState();
    for (const listener of stateListeners) {
      listener(state);
    }
  }

  function draw(): void {
    if (!ctx || !canvas) return;
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, W, H);
  }

  function handleGameOver(): void {
    phase = "gameover";
    emitState();
    stopLoop();
    draw();
  }

  function tick(): void {
    if (phase !== "playing") return;

    direction = { ...nextDirection };

    const head = snake[0];
    const newHead: Vec2 = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    const eating =
      fruit !== null && newHead.x === fruit.x && newHead.y === fruit.y;

    if (isWallCollision(newHead.x, newHead.y) || willHitBody(newHead, snake, eating)) {
      handleGameOver();
      return;
    }

    snake.unshift(newHead);

    if (eating) {
      score += POINTS_PER_FRUIT;
      fruitsEaten++;
      moveInterval = speedAfterFruits(fruitsEaten);
      fruit = spawnFruit(snake);
      if (!fruit) {
        handleGameOver();
        return;
      }
      emitState();
    } else {
      snake.pop();
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (GAME_KEYS.has(e.key)) {
      e.preventDefault();
    }
    if (e.code === "KeyP") return;
    if (paused || phase === "gameover") return;

    const requested = directionFromKey(e.key);
    if (!requested) return;

    nextDirection = resolveDirection(direction, requested);
  }

  function loop(ts: number): void {
    if (!mounted || paused || phase === "gameover" || !imageReady) return;

    const dt = lastTime === null ? 0 : ts - lastTime;
    lastTime = ts;
    tickAccum += dt;

    if (tickAccum >= moveInterval) {
      tickAccum %= moveInterval;
      tick();
    }

    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
    lastTime = null;
    tickAccum = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTime = null;
  }

  function initGame(): void {
    snake = createInitialSnake(INITIAL_SNAKE_LENGTH);
    direction = { ...INITIAL_DIRECTION };
    nextDirection = { ...INITIAL_DIRECTION };
    score = 0;
    fruitsEaten = 0;
    moveInterval = SPEED_INITIAL;
    phase = "playing";
    tickAccum = 0;
    fruit = spawnFruit(snake);
    if (!fruit) {
      phase = "gameover";
    }
    emitState();
    draw();
  }

  function loadFruitsImage(onReady: () => void): void {
    const img = new Image();
    img.onload = () => {
      imageReady = true;
      onReady();
    };
    img.onerror = () => {
      console.error("Failed to load snake fruits spritesheet");
      imageReady = true;
      onReady();
    };
    img.src = FRUITS_IMAGE_SRC;
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
      imageReady = false;
      initGame();

      window.addEventListener("keydown", onKeyDown);

      loadFruitsImage(() => {
        if (!mounted) return;
        if (!paused && phase === "playing") {
          startLoop();
        }
      });
    },

    unmount(): void {
      stopLoop();
      window.removeEventListener("keydown", onKeyDown);
      canvas = null;
      ctx = null;
      mounted = false;
      paused = false;
      imageReady = false;
    },

    pause(): void {
      if (!mounted || paused) return;
      paused = true;
      stopLoop();
    },

    resume(): void {
      if (!mounted || !paused) return;
      paused = false;
      if (phase === "playing" && imageReady) {
        startLoop();
      }
    },

    reset(): void {
      initGame();
      if (mounted && !paused && phase === "playing" && imageReady) {
        startLoop();
      }
    },

    onStateChange(cb: (state: SnakeGameState) => void): () => void {
      stateListeners.add(cb);
      cb(currentState());
      return () => {
        stateListeners.delete(cb);
      };
    },
  };
}
