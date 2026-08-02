import type { CategoryFilter } from "./categories";
import { GAMES } from "./games";
import type { Game, GameCategory, GameColor } from "./games";

export { CATEGORIES, type CategoryFilter } from "./categories";
export { GAMES, type Game, type GameCategory, type GameColor } from "./games";
export { PLAYERS } from "./players";
export { seededScores, type ScoreRow } from "./scores";

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByCategory(cat: CategoryFilter): Game[] {
  if (cat === "TODOS") return GAMES;
  return GAMES.filter((g) => g.cat === cat);
}
