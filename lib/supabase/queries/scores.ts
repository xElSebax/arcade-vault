import type { ScoreRow } from "@/app/data/scores";
import { createClient } from "@/lib/supabase/server";
import type { DbScore } from "@/lib/supabase/types";

function formatScoreDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function toScoreRow(row: DbScore, rank: number): ScoreRow {
  return {
    rank,
    name: row.player_name,
    score: row.score,
    date: formatScoreDate(row.created_at),
  };
}

export async function getLeaderboard(
  gameId: string,
  limit = 12,
): Promise<ScoreRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scores")
    .select("id, game_id, player_name, score, user_id, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row, index) => toScoreRow(row as DbScore, index + 1));
}

export async function getPlayerBestInGame(
  gameId: string,
  playerName: string,
): Promise<{ score: number; rank: number; date: string } | null> {
  const supabase = await createClient();

  const { data: bestRow, error: bestError } = await supabase
    .from("scores")
    .select("id, game_id, player_name, score, user_id, created_at")
    .eq("game_id", gameId)
    .eq("player_name", playerName)
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (bestError || !bestRow) {
    return null;
  }

  const best = bestRow as DbScore;

  const { count, error: countError } = await supabase
    .from("scores")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gt("score", best.score);

  if (countError) {
    return null;
  }

  return {
    score: best.score,
    rank: (count ?? 0) + 1,
    date: formatScoreDate(best.created_at),
  };
}
