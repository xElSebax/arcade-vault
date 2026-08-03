import { GAMES, type Game } from "./games";

export type HomeFeatureIcon = "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";

export type HomeAccentColor = "cyan" | "magenta" | "yellow" | "green";

export interface HomeFeature {
  icon: HomeFeatureIcon;
  title: string;
  description: string;
  color: HomeAccentColor;
}

export interface HomeStat {
  number: string;
  unit: string;
  subtitle: string;
}

export interface HomeTickerRow {
  player: string;
  game: string;
  score: number;
  timeAgo: string;
  color: HomeAccentColor;
}

export interface HomeTopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    description:
      "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    description:
      "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    description:
      "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    description:
      "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

export const HOME_STATS: HomeStat[] = [
  { number: "12+", unit: "JUEGOS", subtitle: "Y CONTANDO" },
  { number: "MILES", unit: "DE PARTIDAS", subtitle: "JUGADAS CADA DÍA" },
  { number: "GLOBAL", unit: "RANKING", subtitle: "COMPITE CON EL MUNDO" },
];

export const HOME_TICKER: HomeTickerRow[] = [
  {
    player: "NEONFOX",
    game: "Caída",
    score: 184220,
    timeAgo: "hace 2 min",
    color: "magenta",
  },
  {
    player: "PX_KAI",
    game: "Glotón",
    score: 96400,
    timeAgo: "hace 5 min",
    color: "yellow",
  },
  {
    player: "Z3R0COOL",
    game: "Invasores",
    score: 54190,
    timeAgo: "hace 8 min",
    color: "green",
  },
  {
    player: "VAULT_07",
    game: "Rocas",
    score: 41200,
    timeAgo: "hace 12 min",
    color: "cyan",
  },
  {
    player: "GLITCHA",
    game: "Bloque Buster",
    score: 28450,
    timeAgo: "hace 18 min",
    color: "cyan",
  },
  {
    player: "ARKADYA",
    game: "Serpentina",
    score: 7820,
    timeAgo: "hace 24 min",
    color: "green",
  },
  {
    player: "CYBER_LU",
    game: "Ranaria",
    score: 18900,
    timeAgo: "hace 31 min",
    color: "yellow",
  },
];

export const HOME_TOP_PLAYERS: HomeTopPlayer[] = [
  { rank: 1, player: "NEONFOX", score: 312840 },
  { rank: 2, player: "PX_KAI", score: 248110 },
  { rank: 3, player: "M00NRYU", score: 196720 },
  { rank: 4, player: "VAULT_07", score: 154300 },
  { rank: 5, player: "GLITCHA", score: 138900 },
];

export const HOME_PRICING_FAQ: HomeFaqItem[] = [
  {
    question: "¿REALMENTE ES GRATIS?",
    answer:
      'Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No hay versión "premium" escondida.',
  },
  {
    question: "¿NECESITO CREAR CUENTA?",
    answer:
      "No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el ranking, regístrate en 10 segundos.",
  },
  {
    question: "¿CÓMO SOBREVIVEN SIN COBRAR?",
    answer:
      "Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que aceptamos.",
  },
];

export function getHomePreviewGames(): Game[] {
  return GAMES.slice(0, 6);
}
