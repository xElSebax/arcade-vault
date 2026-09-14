"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { ArkanoidCanvas } from "@/components/games/arkanoid-canvas";
import { VirtualGameControls } from "@/components/virtual-game-controls";
import { useAuth } from "@/components/providers/auth-provider";
import { STARTING_LIVES } from "@/lib/games/arkanoid/constants";
import {
  arkanoidHudEquals,
  arkanoidHudFromGameState,
  type ArkanoidEngine,
  type ArkanoidGameState,
  type ArkanoidHudState,
} from "@/lib/games/arkanoid/types";
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { TOUCH_MAPS } from "@/lib/games/touch-controls/maps";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import { useGameSkin } from "@/lib/player-skin";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface ArkanoidPlayerProps {
  game: Game;
}

function createInitialHud(): ArkanoidHudState {
  return { score: 0, lives: STARTING_LIVES, level: 1 };
}

export function ArkanoidPlayer({ game }: ArkanoidPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const touchMode = useTouchPlayMode();
  const engineRef = useRef<ArkanoidEngine | null>(null);

  const [hud, setHud] = useState<ArkanoidHudState>(createInitialHud);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getDefaultPlayerName = useCallback(
    () => storedName ?? user?.displayName ?? "INVITADO",
    [storedName, user?.displayName],
  );

  const playerName = initials ?? getDefaultPlayerName();

  const prefillPlayerName = useCallback(() => {
    setInitials((prev) => prev ?? getDefaultPlayerName());
  }, [getDefaultPlayerName]);

  const prefillPlayerNameRef = useRef(prefillPlayerName);
  useEffect(() => {
    prefillPlayerNameRef.current = prefillPlayerName;
  }, [prefillPlayerName]);

  const handleStateChange = useCallback((state: ArkanoidGameState) => {
    setHud((prev) => {
      const next = arkanoidHudFromGameState(state);
      return arkanoidHudEquals(prev, next) ? prev : next;
    });

    if (state.phase === "gameover") {
      setOver(true);
      setWon(false);
      prefillPlayerNameRef.current();
    } else if (state.phase === "win") {
      setOver(true);
      setWon(true);
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
    setWon(false);
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
      lives={hud.lives}
      level={hud.level}
      paused={paused}
      over={over}
      won={won}
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
            map={TOUCH_MAPS.arkanoid}
            onInputChange={handleVirtualInput}
            onActionPulse={handleActionPulse}
            controlsLabel={`Controles de ${game.title}`}
          />
        ) : undefined
      }
      arena={
        <ArkanoidCanvas
          paused={paused || over}
          skin={skin}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
