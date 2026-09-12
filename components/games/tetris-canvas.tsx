"use client";

import { useEffect, useRef } from "react";
import { BLOCK, COLS, ROWS } from "@/lib/games/tetris/constants";
import { createTetrisEngine } from "@/lib/games/tetris/engine";
import type { TetrisEngine, TetrisGameState } from "@/lib/games/tetris/types";
import type { GameSkinId } from "@/lib/games/skins/types";
import { EMPTY_VIRTUAL_INPUT } from "@/lib/games/touch-controls/types";

const BOARD_WIDTH = COLS * BLOCK;
const BOARD_HEIGHT = ROWS * BLOCK;
const NEXT_SIZE = 120;

interface TetrisCanvasProps {
  paused: boolean;
  touchMode?: boolean;
  skin: GameSkinId;
  onStateChange: (state: TetrisGameState) => void;
  engineRef: React.MutableRefObject<TetrisEngine | null>;
}

export function TetrisCanvas({
  paused,
  touchMode = false,
  skin,
  onStateChange,
  engineRef,
}: TetrisCanvasProps) {
  const boardRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<TetrisEngine | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const board = boardRef.current;
    const next = nextRef.current;
    if (!board || !next) return;

    const engine = createTetrisEngine();
    engineInstanceRef.current = engine;
    engineRef.current = engine;

    engine.mount(board, next);

    const unsubscribe = engine.onStateChange((state) => {
      onStateChangeRef.current(state);
    });

    return () => {
      unsubscribe();
      engine.unmount();
      engineInstanceRef.current = null;
      engineRef.current = null;
    };
  }, [engineRef]);

  useEffect(() => {
    const engine = engineInstanceRef.current;
    if (!engine) return;

    if (paused) {
      engine.setVirtualInput(EMPTY_VIRTUAL_INPUT);
      engine.pause();
    } else {
      engine.resume();
    }
  }, [paused]);

  useEffect(() => {
    const engine = engineInstanceRef.current;
    if (!engine) return;
    engine.setSkin(skin);
  }, [skin]);

  return (
    <div
      className={[
        "tetris-canvas-wrap",
        touchMode ? "tetris-canvas-wrap--touch" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="tetris-arena">
        <canvas
          ref={boardRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          className="tetris-board"
        />
        <aside className="tetris-panel">
          <div className="tetris-panel-section">
            <span className="tetris-panel-label">NEXT</span>
            <canvas
              ref={nextRef}
              width={NEXT_SIZE}
              height={NEXT_SIZE}
              className="tetris-next"
            />
          </div>
          <div className="tetris-panel-section tetris-controls">
            <span className="tetris-panel-label">CONTROLES</span>
            <ul>
              <li>
                <kbd>←</kbd>
                <kbd>→</kbd> mover
              </li>
              <li>
                <kbd>↑</kbd>
                <kbd>X</kbd> rotar
              </li>
              <li>
                <kbd>↓</kbd> bajar
              </li>
              <li>
                <kbd>Espacio</kbd> caída
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
