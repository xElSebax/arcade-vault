"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { FroggerCanvas } from "@/components/games/frogger-canvas";
import { VirtualGameControls } from "@/components/virtual-game-controls";
import { useAuth } from "@/components/providers/auth-provider";
import { LEVEL_TIME_SEC, STARTING_LIVES } from "@/lib/games/frogger/constants";
import {
  froggerHudEquals,
  froggerHudFromGameState,
  type FroggerEngine,
  type FroggerGameState,
  type FroggerHudState,
} from "@/lib/games/frogger/types";
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { TOUCH_MAPS } from "@/lib/games/touch-controls/maps";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import { useGameSkin } from "@/lib/player-skin";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface FroggerPlayerProps {
  game: Game;
}

function createInitialHud(): FroggerHudState {
  return {
    score: 0,
    lives: STARTING_LIVES,
    level: 1,
    timeLeft: LEVEL_TIME_SEC,
    frogsHome: 0,
  };
}

export function FroggerPlayer({ game }: FroggerPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const touchMode = useTouchPlayMode();
  const engineRef = useRef<FroggerEngine | null>(null);

  const [hud, setHud] = useState<FroggerHudState>(createInitialHud);
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

  const handleStateChange = useCallback((state: FroggerGameState) => {
    setHud((prev) => {
      const next = froggerHudFromGameState(state);
      return froggerHudEquals(prev, next) ? prev : next;
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
    setHud(createInitialHud());
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
      timeLeft={hud.timeLeft}
      frogsHome={hud.frogsHome}
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
            map={TOUCH_MAPS.frogger}
            onInputChange={handleVirtualInput}
            onActionPulse={handleActionPulse}
            controlsLabel={`Controles de ${game.title}`}
          />
        ) : undefined
      }
      arena={
        <FroggerCanvas
          paused={paused || over}
          skin={skin}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
