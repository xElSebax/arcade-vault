/** Game ids with a dedicated static route under app/games/{id} and app/play/{id}. */
export const STATIC_GAME_ROUTES = ["asteroids"] as const;

export type StaticGameRoute = (typeof STATIC_GAME_ROUTES)[number];

export function hasStaticGameRoute(id: string): id is StaticGameRoute {
  return (STATIC_GAME_ROUTES as readonly string[]).includes(id);
}
