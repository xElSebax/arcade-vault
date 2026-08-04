"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/asteroids/constants";
import { createAsteroidsEngine } from "@/lib/games/asteroids/engine";
import type {
  AsteroidsEngine,
  AsteroidsGameState,
} from "@/lib/games/asteroids/types";

interface AsteroidsCanvasProps {
  paused: boolean;
  onStateChange: (state: AsteroidsGameState) => void;
  engineRef: React.MutableRefObject<AsteroidsEngine | null>;
}

export function AsteroidsCanvas({
  paused,
  onStateChange,
  engineRef,
}: AsteroidsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<AsteroidsEngine | null>(null);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createAsteroidsEngine();
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

  return (
    <div className="asteroids-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="asteroids-canvas"
      />
    </div>
  );
}
