"use client";

import { useCallback, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { AsteroidsCanvas } from "@/components/games/asteroids-canvas";
import { useAuth } from "@/components/providers/auth-provider";
import type { AsteroidsEngine, AsteroidsGameState } from "@/lib/games/asteroids/types";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface AsteroidsPlayerProps {
  game: Game;
}

export function AsteroidsPlayer({ game }: AsteroidsPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const engineRef = useRef<AsteroidsEngine | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const getDefaultPlayerName = useCallback(
    () => storedName ?? user?.name ?? "INVITADO",
    [storedName, user?.name],
  );

  const playerName = initials ?? getDefaultPlayerName();

  const prefillPlayerName = useCallback(() => {
    setInitials((prev) => prev ?? getDefaultPlayerName());
  }, [getDefaultPlayerName]);

  const handleStateChange = useCallback(
    (state: AsteroidsGameState) => {
      setScore(state.score);
      setLives(state.lives);
      setLevel(state.level);
      if (state.phase === "gameover") {
        setOver(true);
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
    setSaved(false);
    setInitials(null);
    engineRef.current?.reset();
  };

  const handleSaveScore = async () => {
    if (saved) return;

    const result = await saveScore({
      gameId: game.id,
      playerName: initials ?? getDefaultPlayerName(),
      score,
    });

    if (result.ok) {
      writePlayerName(initials ?? getDefaultPlayerName());
      setSaved(true);
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
      saved={saved}
      onTogglePause={() => setPaused((p) => !p)}
      onEndGame={endGame}
      onRestart={restart}
      onSaveScore={handleSaveScore}
      onInitialsChange={setInitials}
      arena={
        <AsteroidsCanvas
          paused={paused || over}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
