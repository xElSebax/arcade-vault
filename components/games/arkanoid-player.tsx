"use client";

import { useCallback, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { ArkanoidCanvas } from "@/components/games/arkanoid-canvas";
import { useAuth } from "@/components/providers/auth-provider";
import type {
  ArkanoidEngine,
  ArkanoidGameState,
} from "@/lib/games/arkanoid/types";
import { useGameSkin } from "@/lib/player-skin";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface ArkanoidPlayerProps {
  game: Game;
}

export function ArkanoidPlayer({ game }: ArkanoidPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const engineRef = useRef<ArkanoidEngine | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
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

  const handleStateChange = useCallback(
    (state: ArkanoidGameState) => {
      setScore(state.score);
      setLives(state.lives);
      setLevel(state.level);
      if (state.phase === "gameover") {
        setOver(true);
        setWon(false);
        prefillPlayerName();
      } else if (state.phase === "win") {
        setOver(true);
        setWon(true);
        prefillPlayerName();
      }
    },
    [prefillPlayerName],
  );

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

  const handleSaveScore = async () => {
    if (saved) return;

    setSaveError(null);

    const result = await saveScore({
      gameId: game.id,
      playerName: initials ?? getDefaultPlayerName(),
      score,
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
      score={score}
      lives={lives}
      level={level}
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
