"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Game } from "@/app/data";
import { Btn } from "@/components/btn";
import { useAuth } from "@/components/providers/auth-provider";

interface GamePlayerProps {
  game: Game;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [initials, setInitials] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const playerName = initials ?? user?.name ?? "INVITADO";

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

  const endGame = () => setOver(true);

  const restart = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setInitials(null);
  };

  const saveScore = () => {
    setSaved(true);
  };

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
          <Btn variant="yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </Btn>
          <Btn variant="magenta" onClick={endGame}>
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
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>
          {paused && (
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
                    setInitials(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <Btn variant="yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </Btn>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <Btn onClick={restart}>JUGAR DE NUEVO</Btn>
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
