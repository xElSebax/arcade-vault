"use server";

import {
  getLeaderboardForGame,
  getPlayerBestForGame,
} from "@/lib/data/leaderboard";

export async function fetchLeaderboardForGame(gameId: string, limit = 12) {
  return getLeaderboardForGame(gameId, limit);
}

export async function fetchPlayerBestForGame(
  gameId: string,
  playerName: string,
) {
  return getPlayerBestForGame(gameId, playerName);
}
