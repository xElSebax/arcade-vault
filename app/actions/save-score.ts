"use server";

import { createServiceClient } from "@/lib/supabase/service";

export interface SaveScoreInput {
  gameId: string;
  playerName: string;
  score: number;
}

export type SaveScoreResult =
  | { ok: true }
  | { ok: false; error: string };

function validatePlayerName(name: string): string | null {
  const trimmed = name.trim().toUpperCase();
  if (trimmed.length < 1 || trimmed.length > 10) {
    return null;
  }
  return trimmed;
}

function validateScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0;
}

export async function saveScore(input: SaveScoreInput): Promise<SaveScoreResult> {
  const gameId = input.gameId?.trim();
  if (!gameId) {
    return { ok: false, error: "Identificador de juego inválido." };
  }

  const playerName = validatePlayerName(input.playerName);
  if (!playerName) {
    return {
      ok: false,
      error: "El nombre debe tener entre 1 y 10 caracteres.",
    };
  }

  if (!validateScore(input.score)) {
    return { ok: false, error: "La puntuación debe ser un entero ≥ 0." };
  }

  try {
    const supabase = createServiceClient();

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError || !game) {
      return { ok: false, error: "Juego no encontrado." };
    }

    const { error: insertError } = await supabase.from("scores").insert({
      game_id: gameId,
      player_name: playerName,
      score: input.score,
      user_id: null,
    });

    if (insertError) {
      return { ok: false, error: "No se pudo guardar la puntuación." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la puntuación." };
  }
}
