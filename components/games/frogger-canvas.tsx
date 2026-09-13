"use client";

import { useEffect, useRef } from "react";
import { H, W } from "@/lib/games/frogger/constants";
import { createFroggerEngine } from "@/lib/games/frogger/engine";
import type {
  FroggerEngine,
  FroggerGameState,
} from "@/lib/games/frogger/types";
import type { GameSkinId } from "@/lib/games/skins/types";
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { EMPTY_VIRTUAL_INPUT } from "@/lib/games/touch-controls/types";

interface FroggerCanvasProps {
  paused: boolean;
  skin: GameSkinId;
  onStateChange: (state: FroggerGameState) => void;
  engineRef: React.MutableRefObject<FroggerEngine | null>;
}

export function FroggerCanvas({
  paused,
  skin,
  onStateChange,
  engineRef,
}: FroggerCanvasProps) {
  const touchMode = useTouchPlayMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineInstanceRef = useRef<FroggerEngine | null>(null);
  const onStateChangeRef = useRef(onStateChange);
  const skinRef = useRef(skin);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    skinRef.current = skin;
  }, [skin]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = createFroggerEngine();
    engineInstanceRef.current = engine;
    engineRef.current = engine;

    engine.mount(canvas);
    engine.setSkin(skinRef.current);

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
        "frogger-canvas-wrap",
        touchMode ? "frogger-canvas-wrap--touch" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="frogger-canvas"
      />
    </div>
  );
}
