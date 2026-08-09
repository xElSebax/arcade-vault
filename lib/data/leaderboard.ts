import { seededScores, type ScoreRow } from "@/app/data/scores";
import { isSupabaseGame } from "@/lib/data/supabase-games";
import {
  getLeaderboard,
  getPlayerBestInGame,
} from "@/lib/supabase/queries/scores";

export async function getLeaderboardForGame(
  gameId: string,
  limit?: number,
): Promise<ScoreRow[]> {
  if (isSupabaseGame(gameId)) {
    return getLeaderboard(gameId, limit);
  }
  return seededScores(gameId.length * 17 + 3, limit ?? 10);
}

export async function getPlayerBestForGame(
  gameId: string,
  playerName: string,
): Promise<{ score: number; rank: number; date: string } | null> {
  if (!isSupabaseGame(gameId)) {
    return null;
  }
  return getPlayerBestInGame(gameId, playerName);
}
