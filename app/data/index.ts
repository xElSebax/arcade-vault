import type { CategoryFilter } from "./categories";
import { GAMES } from "./games";
import type { Game } from "./games";

export { CATEGORIES, type CategoryFilter } from "./categories";
export { GAMES, type Game, type GameCategory, type GameColor } from "./games";
export {
  HOME_FEATURES,
  HOME_PRICING_FAQ,
  HOME_STATS,
  HOME_TICKER,
  HOME_TOP_PLAYERS,
  getHomePreviewGames,
  type HomeAccentColor,
  type HomeFaqItem,
  type HomeFeature,
  type HomeFeatureIcon,
  type HomeStat,
  type HomeTickerRow,
  type HomeTopPlayer,
} from "./home";
export { PLAYERS } from "./players";
export { seededScores, type ScoreRow } from "./scores";

export function getGameById(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

export function getGamesByCategory(cat: CategoryFilter): Game[] {
  if (cat === "TODOS") return GAMES;
  return GAMES.filter((g) => g.cat === cat);
}
