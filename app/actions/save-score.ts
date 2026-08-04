"use server";

import { createClient } from "@/lib/supabase/server";

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

function validateScore(score: number): number | null {
  if (!Number.isFinite(score)) {
    return null;
  }
  const normalized = Math.floor(score);
  if (normalized < 0) {
    return null;
  }
  return normalized;
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

  const score = validateScore(input.score);
  if (score === null) {
    return { ok: false, error: "La puntuación debe ser un entero ≥ 0." };
  }

  try {
    const supabase = await createClient();

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
      score,
      user_id: null,
    });

    if (insertError) {
      console.error("[saveScore] insert failed:", insertError.message);
      return {
        ok: false,
        error:
          process.env.NODE_ENV === "development"
            ? `No se pudo guardar: ${insertError.message}`
            : "No se pudo guardar la puntuación.",
      };
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar la puntuación.";
    console.error("[saveScore]", message);
    return { ok: false, error: message };
  }
}
