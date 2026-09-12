"use client";

import { useCallback, useRef, useState } from "react";
import { saveScore } from "@/app/actions/save-score";
import type { Game } from "@/app/data";
import { GamePlayerShell } from "@/components/game-player-shell";
import { TetrisCanvas } from "@/components/games/tetris-canvas";
import { useAuth } from "@/components/providers/auth-provider";
import type { TetrisEngine, TetrisGameState } from "@/lib/games/tetris/types";
import { useGameSkin } from "@/lib/player-skin";
import { usePlayerName, writePlayerName } from "@/lib/player-name";

interface TetrisPlayerProps {
  game: Game;
}

export function TetrisPlayer({ game }: TetrisPlayerProps) {
  const { user } = useAuth();
  const storedName = usePlayerName();
  const [skin, setSkin] = useGameSkin(game.id);
  const engineRef = useRef<TetrisEngine | null>(null);

  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
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

  const handleStateChange = useCallback(
    (state: TetrisGameState) => {
      setScore(state.score);
      setLines(state.lines);
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
      lives={0}
      level={level}
      lines={lines}
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
      arena={
        <TetrisCanvas
          paused={paused || over}
          skin={skin}
          onStateChange={handleStateChange}
          engineRef={engineRef}
        />
      }
    />
  );
}
