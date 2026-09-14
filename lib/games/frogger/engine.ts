import {
  CELL,
  COLS,
  DOCK_ROW,
  H,
  HOME_ROW,
  LEVEL_TIME_SEC,
  MAX_DT,
  POINTS_HOME,
  POINTS_PER_ROW,
  STARTING_LIVES,
  TIME_BONUS_MULT,
  W,
  WIN_HOLD_SEC,
} from "./constants";
import {
  drowned,
  hitsVehicle,
  landedHome,
  ridingPlatform,
} from "./collision";
import { createFrog, resetFrog, startHop, updateHop, type Frog } from "./entities/frog";
import { createHomes, occupiedCount, resetHomes, type Home } from "./entities/home";
import { createPlatform, updatePlatform, type Platform } from "./entities/platform";
import { createVehicle, updateVehicle, type Vehicle } from "./entities/vehicle";
import { shouldYieldKeyboardToDom } from "@/lib/games/keyboard-yield";
import {
  DEFAULT_GAME_SKIN,
  type GameSkinId,
} from "@/lib/games/skins/types";
import { laneGaps, laneSpeed, isRoadLane, isRiverLane, LANES } from "./lanes";
import { createFroggerRenderCache } from "./render-cache";
import { renderWorld } from "./render";
import { FROGGER_SKINS } from "./skins";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import type { FroggerEngine, FroggerGameState, FroggerPhase } from "./types";

const VIRTUAL_ARROW_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
] as const;

function arrowFromTouchAction(action: TouchAction): string | null {
  switch (action) {
    case "move_up":
      return "ArrowUp";
    case "move_down":
      return "ArrowDown";
    case "move_left":
      return "ArrowLeft";
    case "move_right":
      return "ArrowRight";
    default:
      return null;
  }
}

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

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function createFroggerEngine(): FroggerEngine {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let rafId: number | null = null;
  let lastTime: number | null = null;
  let paused = false;
  let mounted = false;
  let currentSkin: GameSkinId = DEFAULT_GAME_SKIN;
  const renderCache = createFroggerRenderCache();

  const keys: Record<string, boolean> = {};
  const justPressed: Record<string, boolean> = {};
  const stateListeners = new Set<(state: FroggerGameState) => void>();

  let frog: Frog = createFrog();
  let vehicles: Vehicle[] = [];
  let platforms: Platform[] = [];
  let homes: Home[] = createHomes();
  let score = 0;
  let lives = STARTING_LIVES;
  let level = 1;
  let timeLeft = LEVEL_TIME_SEC;
  let frogsHome = 0;
  let phase: FroggerPhase = "playing";
  let winHold = 0;
  const rowsReached = new Set<number>();

  function currentState(): FroggerGameState {
    return {
      score,
      lives,
      level,
      timeLeft: Math.max(0, Math.ceil(timeLeft)),
      frogsHome,
      phase,
    };
  }

  function emitState(): void {
    const state = currentState();
    for (const listener of stateListeners) listener(state);
  }

  function pressed(key: string): boolean {
    const val = justPressed[key];
    justPressed[key] = false;
    return !!val;
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (shouldYieldKeyboardToDom(e)) return;
    if (GAME_KEYS.has(e.key)) {
      e.preventDefault();
    }
    if (!keys[e.key]) {
      justPressed[e.key] = true;
    }
    keys[e.key] = true;
  }

  function onKeyUp(e: KeyboardEvent): void {
    keys[e.key] = false;
  }

  function spawnLanes(): void {
    vehicles = [];
    platforms = [];
    for (const lane of LANES) {
      const vx = laneSpeed(lane, level);
      const gaps = laneGaps(lane, level);
      let x = -CELL * 3;
      while (x < W + CELL * 6) {
        if (isRoadLane(lane)) {
          const vehicle = createVehicle({
            x,
            row: lane.row,
            vx,
            kind: lane.vehicleKind,
            widthCells: lane.widthCells,
          });
          vehicles.push(vehicle);
          x += vehicle.w + randRange(gaps.min, gaps.max);
        } else if (isRiverLane(lane)) {
          const platform = createPlatform({
            x,
            row: lane.row,
            vx,
            kind: lane.platformKind,
            widthCells: lane.widthCells,
            sinkPhase: Math.random() * (3 + 1.5),
          });
          platforms.push(platform);
          x += platform.w + randRange(gaps.min, gaps.max);
        }
      }
    }
  }

  function awardRowIfNew(row: number): void {
    if (row >= DOCK_ROW) return;
    if (rowsReached.has(row)) return;
    rowsReached.add(row);
    score += POINTS_PER_ROW;
  }

  function loseLife(resetLevel: boolean): void {
    lives -= 1;
    if (lives <= 0) {
      lives = 0;
      phase = "gameover";
      emitState();
      return;
    }
    resetFrog(frog);
    rowsReached.clear();
    frog.riding = null;
    if (resetLevel) {
      resetHomes(homes);
      frogsHome = 0;
      timeLeft = LEVEL_TIME_SEC;
      spawnLanes();
    }
    emitState();
  }

  function occupyHome(home: Home): void {
    home.occupied = true;
    score += POINTS_HOME;
    frogsHome = occupiedCount(homes);
    resetFrog(frog);
    rowsReached.clear();
    frog.riding = null;
    emitState();
    if (frogsHome >= 5) {
      score += Math.floor(timeLeft) * TIME_BONUS_MULT;
      level += 1;
      phase = "win";
      winHold = WIN_HOLD_SEC;
      emitState();
    }
  }

  function beginNextLevel(): void {
    resetHomes(homes);
    frogsHome = 0;
    resetFrog(frog);
    rowsReached.clear();
    timeLeft = LEVEL_TIME_SEC;
    spawnLanes();
    phase = "playing";
    winHold = 0;
    emitState();
  }

  function consumeHopInput(): { dCol: number; dRow: number } | null {
    if (
      pressed("ArrowUp") ||
      pressed("w") ||
      pressed("W") ||
      keys.ArrowUp ||
      keys.w ||
      keys.W
    ) {
      return { dCol: 0, dRow: -1 };
    }
    if (
      pressed("ArrowDown") ||
      pressed("s") ||
      pressed("S") ||
      keys.ArrowDown ||
      keys.s ||
      keys.S
    ) {
      return { dCol: 0, dRow: 1 };
    }
    if (
      pressed("ArrowLeft") ||
      pressed("a") ||
      pressed("A") ||
      keys.ArrowLeft ||
      keys.a ||
      keys.A
    ) {
      return { dCol: -1, dRow: 0 };
    }
    if (
      pressed("ArrowRight") ||
      pressed("d") ||
      pressed("D") ||
      keys.ArrowRight ||
      keys.d ||
      keys.D
    ) {
      return { dCol: 1, dRow: 0 };
    }
    return null;
  }

  function tryHop(): void {
    const dir = consumeHopInput();
    if (!dir) return;
    const fromCol = Math.round(frog.col);
    const fromRow = Math.round(frog.row);
    const nextCol = fromCol + dir.dCol;
    const nextRow = fromRow + dir.dRow;
    if (nextCol < 0 || nextCol >= COLS || nextRow < 0 || nextRow > DOCK_ROW) {
      return;
    }
    frog.col = fromCol;
    frog.row = fromRow;
    startHop(frog, dir.dCol, dir.dRow);
  }

  function resolveLanding(): void {
    const home = landedHome(frog, homes);
    if (home === "miss") {
      loseLife(false);
      return;
    }
    if (home) {
      occupyHome(home);
      return;
    }
    awardRowIfNew(Math.round(frog.row));
    frog.riding = ridingPlatform(frog, platforms);
    if (hitsVehicle(frog, vehicles) || drowned(frog, platforms)) {
      loseLife(false);
    }
  }

  function update(dt: number): void {
    if (phase === "gameover") return;

    if (phase === "win") {
      winHold -= dt;
      if (winHold <= 0) beginNextLevel();
      return;
    }

    const prevTimeShown = Math.ceil(timeLeft);
    timeLeft -= dt;
    if (timeLeft <= 0) {
      timeLeft = 0;
      loseLife(true);
      return;
    }
    if (Math.ceil(timeLeft) !== prevTimeShown) emitState();

    for (const vehicle of vehicles) updateVehicle(vehicle, dt, W);
    for (const platform of platforms) updatePlatform(platform, dt, W);

    const hopFinished = updateHop(frog, dt);
    if (hopFinished) {
      resolveLanding();
      if (phase !== "playing") return;
    }

    if (phase !== "playing") return;

    if (!frog.hopFrom) {
      tryHop();
    }

    if (!frog.hopFrom) {
      frog.riding = ridingPlatform(frog, platforms);
      if (frog.riding) {
        frog.col += (frog.riding.vx * dt) / CELL;
      }
      const box = {
        x: frog.col * CELL,
        y: frog.row * CELL,
        w: CELL,
        h: CELL,
      };
      if (box.x + box.w * 0.5 < 0 || box.x + box.w * 0.5 > W) {
        loseLife(false);
        return;
      }
      if (frog.row !== HOME_ROW && (hitsVehicle(frog, vehicles) || drowned(frog, platforms))) {
        loseLife(false);
      }
    }
  }

  function draw(): void {
    if (!ctx) return;
    renderWorld(
      ctx,
      { frog, vehicles, platforms, homes },
      currentSkin,
      FROGGER_SKINS[currentSkin],
      renderCache,
    );
  }

  function loop(ts: number): void {
    if (!mounted || paused) return;
    const dt = lastTime === null ? 0 : Math.min(MAX_DT, (ts - lastTime) / 1000);
    lastTime = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop(): void {
    if (rafId !== null) cancelAnimationFrame(rafId);
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

  function initGame(): void {
    frog = createFrog();
    homes = createHomes();
    score = 0;
    lives = STARTING_LIVES;
    level = 1;
    timeLeft = LEVEL_TIME_SEC;
    frogsHome = 0;
    phase = "playing";
    winHold = 0;
    rowsReached.clear();
    spawnLanes();
    emitState();
  }

  return {
    mount(targetCanvas: HTMLCanvasElement): void {
      if (mounted) this.unmount();
      canvas = targetCanvas;
      canvas.width = W;
      canvas.height = H;
      ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2D rendering context");
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
      for (const key of Object.keys(keys)) delete keys[key];
      for (const key of Object.keys(justPressed)) delete justPressed[key];
      renderCache.invalidate();
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
      if (mounted && !paused) draw();
    },

    onStateChange(cb: (state: FroggerGameState) => void): () => void {
      stateListeners.add(cb);
      cb(currentState());
      return () => {
        stateListeners.delete(cb);
      };
    },

    setSkin(skin: GameSkinId): void {
      if (currentSkin === skin) return;
      currentSkin = skin;
      renderCache.invalidate();
      if (mounted) {
        draw();
      }
    },

    getSkin(): GameSkinId {
      return currentSkin;
    },

    setVirtualInput(state: VirtualInputState): void {
      for (const key of VIRTUAL_ARROW_KEYS) {
        keys[key] = false;
        justPressed[key] = false;
      }
      if (state.up) {
        keys.ArrowUp = true;
      } else if (state.down) {
        keys.ArrowDown = true;
      } else if (state.left) {
        keys.ArrowLeft = true;
      } else if (state.right) {
        keys.ArrowRight = true;
      }
    },

    pulseVirtualAction(action: TouchAction): void {
      const arrow = arrowFromTouchAction(action);
      if (!arrow) return;
      justPressed[arrow] = true;
    },
  };
}
