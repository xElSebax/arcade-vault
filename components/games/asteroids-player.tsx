"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { AsteroidsCanvas } from "@/components/games/asteroids-canvas";
import { useAuth } from "@/components/providers/auth-provider";
import type { AsteroidsEngine, AsteroidsGameState } from "@/lib/games/asteroids/types";

interface AsteroidsPlayerProps {
  game: Game;
}

export function AsteroidsPlayer({ game }: AsteroidsPlayerProps) {
  const { user } = useAuth();
  const engineRef = useRef<AsteroidsEngine | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const playerName = initials ?? user?.name ?? "INVITADO";

  const handleStateChange = useCallback((state: AsteroidsGameState) => {
    setScore(state.score);
    setLives(state.lives);
    setLevel(state.level);
    if (state.phase === "gameover") {
      setOver(true);
    }
  }, []);

  const endGame = () => {
    setOver(true);
    setPaused(true);
  };

  const restart = () => {
    setPaused(false);
    setOver(false);
    setSaved(false);
    setInitials(null);
    engineRef.current?.reset();
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
      onSaveScore={() => setSaved(true)}
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
