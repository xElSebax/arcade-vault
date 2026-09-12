import {
  DEFAULT_GAME_SKIN,
  type GameSkinId,
} from "@/lib/games/skins/types";
import {
  CELL,
  COLS,
  H,
  INITIAL_SNAKE_LENGTH,
  POINTS_PER_FRUIT,
  ROWS,
  SPEED_INITIAL,
  W,
} from "./constants";
import { FRUIT_ATLAS, FRUITS_IMAGE_SRC } from "./sprites";
import { SNAKE_SKINS } from "./skins";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
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

function directionFromTouchAction(action: TouchAction): Direction | null {
  switch (action) {
    case "move_up":
      return { x: 0, y: -1 };
    case "move_down":
      return { x: 0, y: 1 };
    case "move_left":
      return { x: -1, y: 0 };
    case "move_right":
      return { x: 1, y: 0 };
    default:
      return null;
  }
}

function directionFromVirtualInput(state: VirtualInputState): Direction | null {
  if (state.up) return { x: 0, y: -1 };
  if (state.down) return { x: 0, y: 1 };
  if (state.left) return { x: -1, y: 0 };
  if (state.right) return { x: 1, y: 0 };
  return null;
}

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
  let fruitsImage: HTMLImageElement | null = null;
  let currentSkin: GameSkinId = DEFAULT_GAME_SKIN;

  const stateListeners = new Set<(state: SnakeGameState) => void>();

  function tokens() {
    return SNAKE_SKINS[currentSkin];
  }

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

  function drawGrid(): void {
    if (!ctx) return;

    const skin = tokens();
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

  function drawFruit(): void {
    if (!ctx || !fruit || !fruitsImage) return;

    const skin = tokens();
    const sprite = FRUIT_ATLAS[fruit.type];
    const px = fruit.x * CELL;
    const py = fruit.y * CELL;
    const inset = 1;

    ctx.imageSmoothingEnabled = false;
    if (skin.fruitFilter) {
      ctx.filter = skin.fruitFilter;
    }
    ctx.drawImage(
      fruitsImage,
      sprite.x,
      sprite.y,
      sprite.w,
      sprite.h,
      px + inset,
      py + inset,
      CELL - inset * 2,
      CELL - inset * 2,
    );
    ctx.filter = "none";
    ctx.imageSmoothingEnabled = true;
  }

  function drawBodySegment(segment: Vec2): void {
    if (!ctx) return;

    const skin = tokens();
    const px = segment.x * CELL;
    const py = segment.y * CELL;
    const pad = 3;
    const size = CELL - pad * 2;

    ctx.fillStyle = skin.body;
    ctx.shadowColor = skin.bodyGlow;
    ctx.shadowBlur = skin.glowBlur ?? 5;
    ctx.fillRect(px + pad, py + pad, size, size);
    ctx.shadowBlur = 0;
  }

  function drawHead(head: Vec2, facing: Direction): void {
    if (!ctx) return;

    const skin = tokens();
    const px = head.x * CELL;
    const py = head.y * CELL;
    const pad = 2;
    const size = CELL - pad * 2;
    const eyeSize = 3;

    ctx.fillStyle = skin.head;
    ctx.shadowColor = skin.bodyGlow;
    ctx.shadowBlur = skin.headGlowBlur ?? skin.glowBlur ?? 10;
    ctx.fillRect(px + pad, py + pad, size, size);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = skin.headOutline;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + pad + 0.5, py + pad + 0.5, size - 1, size - 1);

    ctx.fillStyle = skin.eyeColor;
    if (facing.x === 1) {
      ctx.fillRect(px + CELL - 7, py + 5, eyeSize, eyeSize);
      ctx.fillRect(px + CELL - 7, py + CELL - 8, eyeSize, eyeSize);
    } else if (facing.x === -1) {
      ctx.fillRect(px + 4, py + 5, eyeSize, eyeSize);
      ctx.fillRect(px + 4, py + CELL - 8, eyeSize, eyeSize);
    } else if (facing.y === -1) {
      ctx.fillRect(px + 5, py + 4, eyeSize, eyeSize);
      ctx.fillRect(px + CELL - 8, py + 4, eyeSize, eyeSize);
    } else {
      ctx.fillRect(px + 5, py + CELL - 7, eyeSize, eyeSize);
      ctx.fillRect(px + CELL - 8, py + CELL - 7, eyeSize, eyeSize);
    }
  }

  function drawSnake(): void {
    for (let i = snake.length - 1; i >= 1; i--) {
      drawBodySegment(snake[i]);
    }
    if (snake.length > 0) {
      drawHead(snake[0], direction);
    }
  }

  function drawScanlines(opacity: number): void {
    if (!ctx) return;

    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    for (let y = 0; y < H; y += 2) {
      ctx.fillRect(0, y, W, 1);
    }
  }

  function draw(): void {
    if (!ctx || !canvas) return;

    const skin = tokens();
    ctx.fillStyle = skin.background;
    ctx.fillRect(0, 0, W, H);
    drawGrid();
    drawFruit();
    drawSnake();
    if (skin.scanlineOpacity) {
      drawScanlines(skin.scanlineOpacity);
    }
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

  function queueDirection(requested: Direction): void {
    if (paused || phase === "gameover") return;
    nextDirection = resolveDirection(direction, requested);
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (GAME_KEYS.has(e.key)) {
      e.preventDefault();
    }
    if (e.code === "KeyP") return;
    if (paused || phase === "gameover") return;

    const requested = directionFromKey(e.key);
    if (!requested) return;

    queueDirection(requested);
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
      fruitsImage = img;
      imageReady = true;
      draw();
      onReady();
    };
    img.onerror = () => {
      console.error("Failed to load snake fruits spritesheet");
      fruitsImage = null;
      imageReady = true;
      draw();
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
      fruitsImage = null;
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

    setSkin(skin: GameSkinId): void {
      currentSkin = skin;
      if (mounted) {
        draw();
      }
    },

    getSkin(): GameSkinId {
      return currentSkin;
    },

    setVirtualInput(state: VirtualInputState): void {
      const requested = directionFromVirtualInput(state);
      if (!requested) return;
      queueDirection(requested);
    },

    pulseVirtualAction(action: TouchAction): void {
      const requested = directionFromTouchAction(action);
      if (!requested) return;
      queueDirection(requested);
    },
  };
}
