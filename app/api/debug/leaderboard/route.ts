import { getLeaderboard, getPlayerBestInGame } from "@/lib/supabase/queries/scores";

/** Ruta temporal de prueba — eliminar en paso 3 del spec 06. */
export async function GET() {
  const gameId = "asteroids";
  const leaderboard = await getLeaderboard(gameId);
  const playerBest = await getPlayerBestInGame(gameId, "TEST");

  return Response.json({
    gameId,
    leaderboard,
    playerBest,
  });
}
