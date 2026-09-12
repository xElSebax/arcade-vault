import { DEFAULT_GAME_SKIN, type GameSkinId } from "@/lib/games/skins/types";
import { BLOCK, COLS, ROWS } from "./constants";
import {
  createInitialState,
  hardDrop,
  lockPiece,
  softDrop,
  tryRotate,
  type TetrisPlayState,
} from "./pieces";
import { TETRIS_SKINS } from "./skins";
import type { TetrisEngine, TetrisGameState, TetrisPhase } from "./types";
import { collide, drawBlock, ghostY } from "./utils";

const NEXT_BLOCK = 30;

const GAME_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "KeyX",
  "Space",
]);

export function createTetrisEngine(): TetrisEngine {
  let boardCanvas: HTMLCanvasElement | null = null;
  let nextCanvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let nextCtx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let dropAccum = 0;
  let paused = false;
  let mounted = false;
  let currentSkin: GameSkinId = DEFAULT_GAME_SKIN;

  const stateListeners = new Set<(state: TetrisGameState) => void>();

  function tokens() {
    return TETRIS_SKINS[currentSkin];
  }

  function clearCanvas(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    const skin = tokens();
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (skin.background) {
      context.fillStyle = skin.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  let play: TetrisPlayState = createInitialState();

  function currentState(): TetrisGameState {
    return {
      score: play.score,
      lines: play.lines,
      level: play.level,
      phase: play.phase,
    };
  }

  function emitState(): void {
    const state = currentState();
    for (const listener of stateListeners) {
      listener(state);
    }
  }

  function drawGrid(context: CanvasRenderingContext2D): void {
    const skin = tokens();
    context.strokeStyle = skin.grid;
    context.lineWidth = skin.gridLineWidth ?? 0.5;
    for (let c = 1; c < COLS; c++) {
      context.beginPath();
      context.moveTo(c * BLOCK, 0);
      context.lineTo(c * BLOCK, ROWS * BLOCK);
      context.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      context.beginPath();
      context.moveTo(0, r * BLOCK);
      context.lineTo(COLS * BLOCK, r * BLOCK);
      context.stroke();
    }
  }

  function drawBoard(): void {
    if (!ctx || !boardCanvas) return;

    const skin = tokens();
    clearCanvas(ctx, boardCanvas);
    drawGrid(ctx);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        drawBlock(ctx, c, r, play.board[r][c], BLOCK, skin);
      }
    }

    if (play.phase === "playing") {
      const gy = ghostY(play.current, play.board);
      for (let r = 0; r < play.current.shape.length; r++) {
        for (let c = 0; c < play.current.shape[r].length; c++) {
          if (play.current.shape[r][c]) {
            drawBlock(
              ctx,
              play.current.x + c,
              gy + r,
              play.current.shape[r][c],
              BLOCK,
              skin,
              skin.ghostAlpha,
            );
          }
        }
      }

      for (let r = 0; r < play.current.shape.length; r++) {
        for (let c = 0; c < play.current.shape[r].length; c++) {
          drawBlock(
            ctx,
            play.current.x + c,
            play.current.y + r,
            play.current.shape[r][c],
            BLOCK,
            skin,
          );
        }
      }
    }
  }

  function drawNext(): void {
    if (!nextCtx || !nextCanvas) return;

    const skin = tokens();
    clearCanvas(nextCtx, nextCanvas);
    const shape = play.next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NEXT_BLOCK, skin);
      }
    }
  }

  function draw(): void {
    drawBoard();
    drawNext();
  }

  function handleGameOver(): void {
    emitState();
    stopLoop();
    draw();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (GAME_KEYS.has(e.code)) {
      e.preventDefault();
    }
    if (e.code === "KeyP") return;
    if (paused || play.phase === "gameover") return;

    let phaseAfterAction: TetrisPhase | null = null;

    switch (e.code) {
      case "ArrowLeft":
        if (
          !collide(play.board, play.current.shape, play.current.x - 1, play.current.y)
        ) {
          play.current.x--;
        }
        break;
      case "ArrowRight":
        if (
          !collide(play.board, play.current.shape, play.current.x + 1, play.current.y)
        ) {
          play.current.x++;
        }
        break;
      case "ArrowDown":
        phaseAfterAction = softDrop(play);
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate(play.current, play.board);
        break;
      case "Space":
        phaseAfterAction = hardDrop(play);
        break;
      default:
        return;
    }

    if (phaseAfterAction === "gameover") {
      handleGameOver();
      return;
    }
    if (phaseAfterAction !== null) {
      emitState();
    }

    draw();
  }

  function loop(ts: number): void {
    if (!mounted || paused || play.phase === "gameover") return;

    const dt = lastTime === null ? 0 : ts - lastTime;
    lastTime = ts;
    dropAccum += dt;

    if (dropAccum >= play.dropInterval) {
      dropAccum = 0;
      if (!collide(play.board, play.current.shape, play.current.x, play.current.y + 1)) {
        play.current.y++;
      } else {
        const phase = lockPiece(play);
        if (phase === "gameover") {
          handleGameOver();
          return;
        }
        emitState();
      }
    }

    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    lastTime = null;
    dropAccum = 0;
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
    play = createInitialState();
    dropAccum = 0;
    emitState();
    draw();
  }

  return {
    mount(canvas: HTMLCanvasElement, previewCanvas: HTMLCanvasElement): void {
      if (mounted) {
        this.unmount();
      }

      boardCanvas = canvas;
      nextCanvas = previewCanvas;
      ctx = boardCanvas.getContext("2d");
      nextCtx = nextCanvas.getContext("2d");
      if (!ctx || !nextCtx) {
        throw new Error("Could not get 2D rendering context");
      }

      mounted = true;
      paused = false;
      initGame();

      window.addEventListener("keydown", onKeyDown);
      startLoop();
    },

    unmount(): void {
      stopLoop();
      window.removeEventListener("keydown", onKeyDown);
      boardCanvas = null;
      nextCanvas = null;
      ctx = null;
      nextCtx = null;
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
      if (mounted && !paused && play.phase === "playing") {
        startLoop();
      }
    },

    onStateChange(cb: (state: TetrisGameState) => void): () => void {
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
  };
}
