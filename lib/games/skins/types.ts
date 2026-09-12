export type GameSkinId = "classic" | "retro" | "neon";

export const DEFAULT_GAME_SKIN: GameSkinId = "classic";

export const GAME_SKINS: readonly {
  id: GameSkinId;
  label: string;
}[] = [
  { id: "classic", label: "CLÁSICO" },
  { id: "retro", label: "RETRO" },
  { id: "neon", label: "NEÓN" },
];

export function isGameSkinId(value: string): value is GameSkinId {
  return value === "classic" || value === "retro" || value === "neon";
}
