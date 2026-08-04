"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { Game } from "@/app/data";
import { Btn } from "@/components/btn";

interface GamePlayerShellProps {
  game: Game;
  playerName: string;
  score: number;
  lives: number;
  level: number;
  paused: boolean;
  over: boolean;
  saved: boolean;
  onTogglePause: () => void;
  onEndGame: () => void;
  onRestart: () => void;
  onSaveScore: () => void;
  onInitialsChange: (value: string) => void;
  arena: ReactNode;
}

export function GamePlayerShell({
  game,
  playerName,
  score,
  lives,
  level,
  paused,
  over,
  saved,
  onTogglePause,
  onEndGame,
  onRestart,
  onSaveScore,
  onInitialsChange,
  arena,
}: GamePlayerShellProps) {
  const router = useRouter();

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {playerName}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{"♥ ".repeat(lives).trim() || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <Btn variant="yellow" onClick={onTogglePause}>
            {paused ? "REANUDAR" : "PAUSA"}
          </Btn>
          <Btn variant="magenta" onClick={onEndGame}>
            FIN
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => router.push(`/games/${game.id}`)}
          >
            SALIR
          </Btn>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          {arena}
          {paused && !over && (
            <div
              className="crt-content"
              style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>
            {game.title} · CRT-83 · 60 HZ
          </span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd" onClick={() => {}}>
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={playerName}
                  onChange={(e) =>
                    onInitialsChange(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <Btn variant="yellow" onClick={onSaveScore}>
                  GUARDAR PUNTUACIÓN
                </Btn>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <Btn onClick={onRestart}>JUGAR DE NUEVO</Btn>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
