/** Games whose leaderboard reads/writes Supabase instead of mock data. */
export const SUPABASE_GAMES = new Set(["asteroids", "tetris", "arkanoid", "snake", "frogger"]);

export function isSupabaseGame(gameId: string): boolean {
  return SUPABASE_GAMES.has(gameId);
}
