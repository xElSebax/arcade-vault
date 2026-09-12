import type { BlockColor } from "./types";

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const EXPLOSION_FRAMES: Record<BlockColor, SpriteFrame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

export const SPRITES = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  } satisfies Record<BlockColor, SpriteFrame>,
};

const SPRITESHEET_PATH = "/games/arkanoid/spritesheet-breakout.png";

let ssCanvas: HTMLCanvasElement | null = null;
let ssLoaded = false;
const ssCallbacks: Array<() => void> = [];

export function isSpritesheetReady(): boolean {
  return ssLoaded;
}

export function loadSpritesheet(cb: () => void): void {
  if (ssLoaded) {
    cb();
    return;
  }

  ssCallbacks.push(cb);
  if (ssCanvas) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement("canvas");
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext("2d");
    if (!octx) return;
    octx.drawImage(rawImg, 0, 0);
    ssCanvas = oc;
    ssLoaded = true;
    ssCallbacks.forEach((fn) => fn());
    ssCallbacks.length = 0;
  };
  rawImg.onerror = () => console.error("Failed to load arkanoid spritesheet");
  rawImg.src = SPRITESHEET_PATH;
}

export interface SpriteDrawOptions {
  filter?: string;
  glowBlur?: number;
  glowColor?: string;
}

function applySpriteDrawOptions(
  ctx: CanvasRenderingContext2D,
  options?: SpriteDrawOptions,
): void {
  if (options?.filter && options.filter !== "none") {
    ctx.filter = options.filter;
  }
  if (options?.glowBlur) {
    ctx.shadowBlur = options.glowBlur;
    ctx.shadowColor = options.glowColor ?? "rgba(0, 245, 255, 0.85)";
  }
}

function resetSpriteDrawOptions(ctx: CanvasRenderingContext2D): void {
  ctx.filter = "none";
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: SpriteDrawOptions,
): void {
  if (!ssLoaded || !ssCanvas) return;
  applySpriteDrawOptions(ctx, options);
  ctx.drawImage(
    ssCanvas,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    x,
    y,
    w,
    h,
  );
  resetSpriteDrawOptions(ctx);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  options?: SpriteDrawOptions,
): void {
  if (!ssLoaded || !ssCanvas) return;

  let sp: SpriteFrame | undefined;
  if (name.startsWith("block_")) {
    const color = name.slice(6) as BlockColor;
    sp = SPRITES.blocks[color];
  } else {
    sp = SPRITES[name as "paddle" | "ball"];
  }

  if (!sp) return;
  applySpriteDrawOptions(ctx, options);
  ctx.drawImage(ssCanvas, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
  resetSpriteDrawOptions(ctx);
}
