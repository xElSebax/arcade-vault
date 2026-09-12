"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/arkanoid/constants";
import { createArkanoidEngine } from "@/lib/games/arkanoid/engine";
import type {
  ArkanoidEngine,
  ArkanoidGameState,
} from "@/lib/games/arkanoid/types";
import type { GameSkinId } from "@/lib/games/skins/types";

interface ArkanoidCanvasProps {
  paused: boolean;
  skin: GameSkinId;
  onStateChange: (state: ArkanoidGameState) => void;
  engineRef: React.MutableRefObject<ArkanoidEngine | null>;
}

export function ArkanoidCanvas({
  paused,
  skin,
  onStateChange,
  engineRef,
}: ArkanoidCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<ArkanoidEngine | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createArkanoidEngine();
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
    <div className="arkanoid-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="arkanoid-canvas"
      />
    </div>
  );
}
