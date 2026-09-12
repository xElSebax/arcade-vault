"use client";

import { GAME_SKINS, type GameSkinId } from "@/lib/games/skins/types";

interface GameSkinSelectorProps {
  skin: GameSkinId;
  onSkinChange: (skin: GameSkinId) => void;
  variant?: "default" | "compact";
}

export function GameSkinSelector({
  skin,
  onSkinChange,
  variant = "default",
}: GameSkinSelectorProps) {
  if (variant === "compact") {
    return (
      <label className="skin-selector-compact">
        <span className="skin-selector-compact__label">SKIN</span>
        <select
          className="skin-selector-compact__select"
          value={skin}
          aria-label="Seleccionar skin visual"
          onChange={(event) => onSkinChange(event.target.value as GameSkinId)}
        >
          {GAME_SKINS.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="skin-selector" role="group" aria-label="Seleccionar skin visual">
      {GAME_SKINS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`skin-selector-btn${skin === id ? " active" : ""}`}
          aria-pressed={skin === id}
          onClick={() => onSkinChange(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
