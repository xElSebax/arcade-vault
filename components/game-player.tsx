"use client";

import { useEffect, useState } from "react";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { useAuth } from "@/components/providers/auth-provider";

interface GamePlayerProps {
  game: Game;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const { user } = useAuth();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const playerName = initials ?? user?.displayName ?? "INVITADO";

  useEffect(() => {
    if (over || paused) return;
    const timer = setInterval(() => {
      setScore((s) => {
        const next = s + Math.floor(10 + Math.random() * 90);
        if (next > 0 && next % 2500 < 100) {
          setLevel((l) => l + 1);
        }
        return next;
      });
    }, 220);
    return () => clearInterval(timer);
  }, [over, paused]);

  const restart = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setInitials(null);
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
      onEndGame={() => setOver(true)}
      onRestart={restart}
      onSaveScore={() => setSaved(true)}
      onInitialsChange={setInitials}
      arena={
        <div className="game-arena">
          <div className="grid-floor" />
          <div className="enemy e1" />
          <div className="enemy e2" />
          <div className="enemy e3" />
          <div className="player-ship" />
        </div>
      }
    />
  );
}
