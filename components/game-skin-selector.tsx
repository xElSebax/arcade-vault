"use client";

import { GAME_SKINS, type GameSkinId } from "@/lib/games/skins/types";

interface GameSkinSelectorProps {
  skin: GameSkinId;
  onSkinChange: (skin: GameSkinId) => void;
}

export function GameSkinSelector({ skin, onSkinChange }: GameSkinSelectorProps) {
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
