"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { TetrisCanvas } from "@/components/games/tetris-canvas";
import { VirtualGameControls } from "@/components/virtual-game-controls";
import {
  tetrisHudEquals,
  tetrisHudFromGameState,
  type TetrisEngine,
  type TetrisGameState,
  type TetrisHudState,
} from "@/lib/games/tetris/types";
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { TOUCH_MAPS } from "@/lib/games/touch-controls/maps";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import { useGameSkin } from "@/lib/player-skin";
import { writePlayerName } from "@/lib/player-name";
import { useDefaultPlayerName } from "@/lib/use-default-player-name";

interface TetrisPlayerProps {
  game: Game;
}

function createInitialHud(): TetrisHudState {
  return { score: 0, lines: 0, level: 1 };
}

export function TetrisPlayer({ game }: TetrisPlayerProps) {
  const defaultPlayerName = useDefaultPlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const touchMode = useTouchPlayMode();
  const engineRef = useRef<TetrisEngine | null>(null);

  const [hud, setHud] = useState<TetrisHudState>(createInitialHud);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getDefaultPlayerName = useCallback(
    () => defaultPlayerName,
    [defaultPlayerName],
  );

  const playerName = initials ?? getDefaultPlayerName();

  const prefillPlayerName = useCallback(() => {
    setInitials((prev) => prev ?? getDefaultPlayerName());
  }, [getDefaultPlayerName]);

  const prefillPlayerNameRef = useRef(prefillPlayerName);
  useEffect(() => {
    prefillPlayerNameRef.current = prefillPlayerName;
  }, [prefillPlayerName]);

  const handleStateChange = useCallback((state: TetrisGameState) => {
    setHud((prev) => {
      const next = tetrisHudFromGameState(state);
      return tetrisHudEquals(prev, next) ? prev : next;
    });
    if (state.phase === "gameover") {
      setOver(true);
      prefillPlayerNameRef.current();
    }
  }, []);

  const endGame = () => {
    setOver(true);
    setPaused(true);
    prefillPlayerName();
  };

  const restart = () => {
    setPaused(false);
    setOver(false);
    setSaved(false);
    setSaveError(null);
    setInitials(null);
    engineRef.current?.reset();
  };

  const handleVirtualInput = useCallback((state: VirtualInputState) => {
    engineRef.current?.setVirtualInput(state);
  }, []);

  const handleActionPulse = useCallback((action: TouchAction) => {
    engineRef.current?.pulseVirtualAction(action);
  }, []);

  const handleSaveScore = async () => {
    if (saved) return;

    setSaveError(null);

    const result = await saveScore({
      gameId: game.id,
      playerName: initials ?? getDefaultPlayerName(),
      score: hud.score,
    });

    if (result.ok) {
      writePlayerName(initials ?? getDefaultPlayerName());
      setSaved(true);
    } else {
      setSaveError(result.error);
    }
  };

  return (
    <GamePlayerShell
      game={game}
      playerName={playerName}
      score={hud.score}
      lives={0}
      level={hud.level}
      lines={hud.lines}
      hideLives
      paused={paused}
      over={over}
      saved={saved}
      skin={skin}
      onSkinChange={setSkin}
      onTogglePause={() => setPaused((p) => !p)}
      onEndGame={endGame}
      onRestart={restart}
      onSaveScore={handleSaveScore}
      onInitialsChange={setInitials}
      saveError={saveError}
      touchMode={touchMode}
      touchControls={
        touchMode && !paused && !over ? (
          <VirtualGameControls
            map={TOUCH_MAPS.tetris}
            onInputChange={handleVirtualInput}
            onActionPulse={handleActionPulse}
            controlsLabel={`Controles de ${game.title}`}
          />
        ) : undefined
      }
      arena={
        <TetrisCanvas
          paused={paused || over}
          touchMode={touchMode}
          skin={skin}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
