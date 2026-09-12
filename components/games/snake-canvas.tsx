"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/snake/constants";
import { createSnakeEngine } from "@/lib/games/snake/engine";
import type { SnakeEngine, SnakeGameState } from "@/lib/games/snake/types";
import type { GameSkinId } from "@/lib/games/skins/types";
import { EMPTY_VIRTUAL_INPUT } from "@/lib/games/touch-controls/types";

interface SnakeCanvasProps {
  paused: boolean;
  skin: GameSkinId;
  onStateChange: (state: SnakeGameState) => void;
  engineRef: React.MutableRefObject<SnakeEngine | null>;
}

export function SnakeCanvas({
  paused,
  skin,
  onStateChange,
  engineRef,
}: SnakeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<SnakeEngine | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createSnakeEngine();
    engineInstanceRef.current = engine;
    engineRef.current = engine;

    engine.mount(canvas);

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
    <div className="snake-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="snake-canvas"
      />
    </div>
  );
}
