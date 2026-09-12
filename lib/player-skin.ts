"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_GAME_SKIN,
  type GameSkinId,
  isGameSkinId,
} from "@/lib/games/skins/types";

const SKIN_EVENT = "av-game-skin-change";

function skinKey(gameId: string): string {
  return `av_game_skin_${gameId}`;
}

export function readGameSkin(gameId: string): GameSkinId {
  if (typeof window === "undefined") return DEFAULT_GAME_SKIN;
  try {
    const raw = localStorage.getItem(skinKey(gameId));
    if (raw && isGameSkinId(raw)) return raw;
  } catch {
    // localStorage deshabilitado
  }
  return DEFAULT_GAME_SKIN;
}

function subscribe(gameId: string, onStoreChange: () => void) {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<{ gameId: string }>).detail;
    if (detail?.gameId === gameId) onStoreChange();
  };
  window.addEventListener(SKIN_EVENT, handler);
  return () => window.removeEventListener(SKIN_EVENT, handler);
}

function getServerSnapshot(): GameSkinId {
  return DEFAULT_GAME_SKIN;
}

export function useGameSkin(gameId: string): [GameSkinId, (skin: GameSkinId) => void] {
  const skin = useSyncExternalStore(
    (onStoreChange) => subscribe(gameId, onStoreChange),
    () => readGameSkin(gameId),
    getServerSnapshot,
  );

  const setSkin = useCallback(
    (next: GameSkinId) => {
      writeGameSkin(gameId, next);
    },
    [gameId],
  );

  return [skin, setSkin];
}

export function writeGameSkin(gameId: string, skin: GameSkinId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(skinKey(gameId), skin);
    window.dispatchEvent(
      new CustomEvent(SKIN_EVENT, { detail: { gameId } }),
    );
  } catch {
    // localStorage deshabilitado — ignorar
  }
}
