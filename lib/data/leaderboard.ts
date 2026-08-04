import { seededScores, type ScoreRow } from "@/app/data/scores";
import {
  getLeaderboard,
  getPlayerBestInGame,
} from "@/lib/supabase/queries/scores";

const SUPABASE_GAMES = new Set(["asteroids"]);

export async function getLeaderboardForGame(
  gameId: string,
  limit?: number,
): Promise<ScoreRow[]> {
  if (SUPABASE_GAMES.has(gameId)) {
    return getLeaderboard(gameId, limit);
  }
  return seededScores(gameId.length * 17 + 3, limit ?? 10);
}

export async function getPlayerBestForGame(
  gameId: string,
  playerName: string,
): Promise<{ score: number; rank: number; date: string } | null> {
  if (!SUPABASE_GAMES.has(gameId)) {
    return null;
  }
  return getPlayerBestInGame(gameId, playerName);
}
