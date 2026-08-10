import {
  BLOCK_H,
  BLOCK_W,
  BLOCKS_ORIGIN_X,
  BLOCKS_ORIGIN_Y,
} from "../constants";
import type { LevelBlockDef } from "../levels";
import type { BlockColor } from "../types";

export interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  alive: boolean;
}

export function createBlock(def: LevelBlockDef): Block {
  return {
    x: BLOCKS_ORIGIN_X + def.col * BLOCK_W,
    y: BLOCKS_ORIGIN_Y + def.row * BLOCK_H,
    w: BLOCK_W,
    h: BLOCK_H,
    color: def.color,
    alive: true,
  };
}

/** Spawn all blocks for a level definition. */
export function spawnBlocks(blockDefs: LevelBlockDef[]): Block[] {
  return blockDefs.map(createBlock);
}

/** Whether every block in the array has been destroyed. */
export function allBlocksDestroyed(blocks: Block[]): boolean {
  return blocks.every((block) => !block.alive);
}
