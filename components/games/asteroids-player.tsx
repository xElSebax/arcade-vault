"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { AsteroidsCanvas } from "@/components/games/asteroids-canvas";
import { VirtualGameControls } from "@/components/virtual-game-controls";
import { useAuth } from "@/components/providers/auth-provider";
import {
  asteroidsHudEquals,
  asteroidsHudFromGameState,
  type AsteroidsEngine,
  type AsteroidsGameState,
  type AsteroidsHudState,
} from "@/lib/games/asteroids/types";
import { useTouchPlayMode } from "@/lib/games/touch-controls/detect-touch-mode";
import { TOUCH_MAPS } from "@/lib/games/touch-controls/maps";
import type {
  TouchAction,
  VirtualInputState,
} from "@/lib/games/touch-controls/types";
import { useGameSkin } from "@/lib/player-skin";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface AsteroidsPlayerProps {
  game: Game;
}

function createInitialHud(): AsteroidsHudState {
  return { score: 0, lives: 3, level: 1 };
}

export function AsteroidsPlayer({ game }: AsteroidsPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const touchMode = useTouchPlayMode();
  const engineRef = useRef<AsteroidsEngine | null>(null);

  const [hud, setHud] = useState<AsteroidsHudState>(createInitialHud);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const getDefaultPlayerName = useCallback(
    () => storedName ?? user?.name ?? "INVITADO",
    [storedName, user?.name],
  );

  const playerName = initials ?? getDefaultPlayerName();

  const prefillPlayerName = useCallback(() => {
    setInitials((prev) => prev ?? getDefaultPlayerName());
  }, [getDefaultPlayerName]);

  const prefillPlayerNameRef = useRef(prefillPlayerName);
  useEffect(() => {
    prefillPlayerNameRef.current = prefillPlayerName;
  }, [prefillPlayerName]);

  const handleStateChange = useCallback((state: AsteroidsGameState) => {
    setHud((prev) => {
      const next = asteroidsHudFromGameState(state);
      return asteroidsHudEquals(prev, next) ? prev : next;
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
            map={TOUCH_MAPS.asteroids}
            onInputChange={handleVirtualInput}
            onActionPulse={handleActionPulse}
            controlsLabel={`Controles de ${game.title}`}
          />
        ) : undefined
      }
      arena={
        <AsteroidsCanvas
          paused={paused || over}
          skin={skin}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
