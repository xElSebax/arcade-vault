import { BLOCK, COLS, ROWS } from "./constants";
import type { GameSkinId } from "@/lib/games/skins/types";
import type { TetrisSkinTokens } from "./skins";

const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function buildGlowSprite(
  blockSize: number,
  color: string,
  blur: number,
): { canvas: HTMLCanvasElement; pad: number } {
  const pad = Math.ceil(blur * 2);
  const canvas = createCanvas(blockSize + pad * 2, blockSize + pad * 2);
  const spriteCtx = canvas.getContext("2d");
  if (!spriteCtx) {
    return { canvas, pad };
  }
  spriteCtx.shadowColor = color;
  spriteCtx.shadowBlur = blur;
  spriteCtx.fillStyle = color;
  spriteCtx.fillRect(pad, pad, blockSize, blockSize);
  spriteCtx.shadowBlur = 0;
  return { canvas, pad };
}

function drawGridOnContext(
  context: CanvasRenderingContext2D,
  skin: TetrisSkinTokens,
): void {
  context.strokeStyle = skin.grid;
  context.lineWidth = skin.gridLineWidth ?? 0.5;
  for (let c = 1; c < COLS; c++) {
    context.beginPath();
    context.moveTo(c * BLOCK, 0);
    context.lineTo(c * BLOCK, BOARD_H);
    context.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    context.beginPath();
    context.moveTo(0, r * BLOCK);
    context.lineTo(BOARD_W, r * BLOCK);
    context.stroke();
  }
}

function buildStaticBoardLayer(skin: TetrisSkinTokens): HTMLCanvasElement {
  const layer = createCanvas(BOARD_W, BOARD_H);
  const layerCtx = layer.getContext("2d");
  if (!layerCtx) return layer;

  layerCtx.clearRect(0, 0, BOARD_W, BOARD_H);
  if (skin.background) {
    layerCtx.fillStyle = skin.background;
    layerCtx.fillRect(0, 0, BOARD_W, BOARD_H);
  }
  drawGridOnContext(layerCtx, skin);
  return layer;
}

type GlowKey = `${number}:${number}`;

export class TetrisRenderCache {
  private skinId: GameSkinId | null = null;
  private staticBoard: HTMLCanvasElement | null = null;
  private glowSprites = new Map<GlowKey, { canvas: HTMLCanvasElement; pad: number }>();

  ensure(skinId: GameSkinId, skin: TetrisSkinTokens): void {
    if (this.skinId === skinId) return;
    this.invalidate();
    this.skinId = skinId;
    this.staticBoard = buildStaticBoardLayer(skin);

    if (skin.glowBlur) {
      for (let colorIndex = 1; colorIndex < skin.colors.length; colorIndex++) {
        const color = skin.colors[colorIndex];
        if (!color) continue;
        for (const cellSize of [BLOCK, 30] as const) {
          const blockSize = cellSize - 2;
          const key: GlowKey = `${colorIndex}:${cellSize}`;
          this.glowSprites.set(
            key,
            buildGlowSprite(blockSize, color, skin.glowBlur),
          );
        }
      }
    }
  }

  invalidate(): void {
    this.skinId = null;
    this.staticBoard = null;
    this.glowSprites.clear();
  }

  blitStaticBoard(ctx: CanvasRenderingContext2D): void {
    if (!this.staticBoard) return;
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.drawImage(this.staticBoard, 0, 0);
  }

  drawBlockGlow(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    colorIndex: number,
    cellSize: number,
  ): boolean {
    const key: GlowKey = `${colorIndex}:${cellSize}`;
    const sprite = this.glowSprites.get(key);
    if (!sprite) return false;
    ctx.drawImage(sprite.canvas, px - sprite.pad, py - sprite.pad);
    return true;
  }
}

export function createTetrisRenderCache(): TetrisRenderCache {
  return new TetrisRenderCache();
}
