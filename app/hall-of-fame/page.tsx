"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  fetchLeaderboardForGame,
  fetchPlayerBestForGame,
  fetchPlayerBestForGameByUserId,
} from "@/app/actions/leaderboard";
import { GAMES, seededScores, type ScoreRow } from "@/app/data";
import { useAuth } from "@/components/providers/auth-provider";
import { isSupabaseGame } from "@/lib/data/supabase-games";
import { normalizePlayerName, usePlayerName } from "@/lib/player-name";

export default function HallOfFamePage() {
  const { user, isLoading: authLoading } = useAuth();
  const storedName = usePlayerName();
  const [tab, setTab] = useState(GAMES[0].id);
  const [supabaseRows, setSupabaseRows] = useState<ScoreRow[]>([]);
  const [playerBest, setPlayerBest] = useState<{
    score: number;
    rank: number;
    date: string;
  } | null>(null);

  const usesSupabase = isSupabaseGame(tab);
  const mockRows = useMemo(() => seededScores(tab.length * 23 + 7, 12), [tab]);
  const rows = usesSupabase ? supabaseRows : mockRows;
  const game = GAMES.find((g) => g.id === tab);

  const displayName =
    storedName ?? (user?.displayName ? normalizePlayerName(user.displayName) : null);

  const youLabel =
    user?.displayName != null
      ? normalizePlayerName(user.displayName)
      : displayName;

  const mockPersonalBest = useMemo(() => {
    if (usesSupabase || !displayName) {
      return null;
    }
    const seedRows = seededScores(tab.length * 23 + displayName.length, 12);
    return {
      rank: 8 + (tab.length % 4),
      score: (seedRows[5]?.score ?? 12400) - 2400,
      date: "11/05/2026",
    };
  }, [usesSupabase, displayName, tab]);

  const handleTabChange = (gameId: string) => {
    if (gameId !== tab && isSupabaseGame(gameId)) {
      setSupabaseRows([]);
      setPlayerBest(null);
    }
    setTab(gameId);
  };

  useEffect(() => {
    if (!usesSupabase) {
      return;
    }

    let cancelled = false;

    fetchLeaderboardForGame(tab, 12).then((data) => {
      if (!cancelled) {
        setSupabaseRows(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [tab, usesSupabase]);

  useEffect(() => {
    if (!usesSupabase || authLoading) {
      return;
    }

    let cancelled = false;

    const loadPlayerBest = async () => {
      if (user?.id) {
        const byUser = await fetchPlayerBestForGameByUserId(tab, user.id);
        if (!cancelled) {
          setPlayerBest(byUser);
        }
        return;
      }

      if (!displayName) {
        if (!cancelled) {
          setPlayerBest(null);
        }
        return;
      }

      const byName = await fetchPlayerBestForGame(tab, displayName);
      if (!cancelled) {
        setPlayerBest(byName);
      }
    };

    void loadPlayerBest();

    return () => {
      cancelled = true;
    };
  }, [tab, usesSupabase, authLoading, user?.id, displayName]);

  if (!game) {
    return null;
  }

  const showSupabaseYouRow = usesSupabase && playerBest && (user?.id || displayName);
  const showMockYouRow = !usesSupabase && mockPersonalBest && youLabel;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`chip${tab === g.id ? " active" : ""}`}
            onClick={() => handleTabChange(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {rows.length >= 3 && (
        <div className="podium">
          <div className="podium-slot silver">
            <div className="rank-num">02</div>
            <div className="name">{rows[1].name}</div>
            <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
            <div className="date">{rows[1].date}</div>
          </div>
          <div className="podium-slot gold">
            <div
              className="pixel"
              style={{
                fontSize: 9,
                color: "var(--gold)",
                letterSpacing: "0.18em",
              }}
            >
              CAMPEÓN
            </div>
            <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
              01
            </div>
            <div className="name">{rows[0].name}</div>
            <div className="score" style={{ fontSize: 20 }}>
              {rows[0].score.toLocaleString("es-ES")}
            </div>
            <div className="date">{rows[0].date}</div>
          </div>
          <div className="podium-slot bronze">
            <div className="rank-num">03</div>
            <div className="name">{rows[2].name}</div>
            <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
            <div className="date">{rows[2].date}</div>
          </div>
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <div>RANGO</div>
          <div>JUGADOR</div>
          <div>PUNTUACIÓN</div>
          <div>FECHA</div>
        </div>
        {rows.map((row, i) => (
          <div
            key={`${row.name}-${row.rank}`}
            className={`tr${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="rk">#{String(row.rank).padStart(2, "0")}</div>
            <div className="pl">{row.name}</div>
            <div className="sc">{row.score.toLocaleString("es-ES")}</div>
            <div className="dt">{row.date}</div>
          </div>
        ))}
        {showSupabaseYouRow && (
          <>
            <div className="tr you-label">
              ▸ TU MEJOR MARCA EN {game.title}
            </div>
            <div
              className="tr you"
              style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
            >
              <div className="rk" style={{ color: "var(--yellow)" }}>
                #{String(playerBest.rank).padStart(2, "0")}
              </div>
              <div className="pl" style={{ color: "var(--yellow)" }}>
                {youLabel}
              </div>
              <div
                className="sc"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                {playerBest.score.toLocaleString("es-ES")}
              </div>
              <div className="dt">{playerBest.date}</div>
            </div>
          </>
        )}
        {showMockYouRow && (
          <>
            <div className="tr you-label">
              ▸ TU MEJOR MARCA EN {game.title}
            </div>
            <div
              className="tr you"
              style={{ animationDelay: `${rows.length * 50 + 50}ms` }}
            >
              <div className="rk" style={{ color: "var(--yellow)" }}>
                #{String(mockPersonalBest.rank).padStart(2, "0")}
              </div>
              <div className="pl" style={{ color: "var(--yellow)" }}>
                {youLabel}
              </div>
              <div
                className="sc"
                style={{
                  color: "var(--yellow)",
                  textShadow: "0 0 6px rgba(245,255,0,0.5)",
                }}
              >
                {mockPersonalBest.score.toLocaleString("es-ES")}
              </div>
              <div className="dt">{mockPersonalBest.date}</div>
            </div>
          </>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
