"use server";

import {
  getLeaderboardForGame,
  getPlayerBestForGame,
  getPlayerBestForGameByUserId,
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

export async function fetchPlayerBestForGameByUserId(
  gameId: string,
  userId: string,
) {
  return getPlayerBestForGameByUserId(gameId, userId);
}
