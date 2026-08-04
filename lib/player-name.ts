export const PLAYER_NAME_KEY = "av_player_name";

/** Misma normalización que auth mock: trim, uppercase, máx. 10 caracteres. */
export function normalizePlayerName(name: string): string {
  const trimmed = name.trim();
  return (trimmed || "PLAYER1").toUpperCase().slice(0, 10);
}

export function readPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLAYER_NAME_KEY);
    if (!raw) return null;
    return normalizePlayerName(raw);
  } catch {
    return null;
  }
}

export function writePlayerName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, normalizePlayerName(name));
  } catch {
    // localStorage deshabilitado — ignorar
  }
}
