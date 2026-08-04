"use client";

import { useSyncExternalStore } from "react";

export const PLAYER_NAME_KEY = "av_player_name";
const PLAYER_NAME_EVENT = "av-player-name-change";

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

function subscribe(onStoreChange: () => void) {
  window.addEventListener(PLAYER_NAME_EVENT, onStoreChange);
  return () => window.removeEventListener(PLAYER_NAME_EVENT, onStoreChange);
}

function getServerSnapshot(): string | null {
  return null;
}

export function usePlayerName(): string | null {
  return useSyncExternalStore(subscribe, readPlayerName, getServerSnapshot);
}

function notifyPlayerNameChange() {
  window.dispatchEvent(new Event(PLAYER_NAME_EVENT));
}

export function writePlayerName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYER_NAME_KEY, normalizePlayerName(name));
    notifyPlayerNameChange();
  } catch {
    // localStorage deshabilitado — ignorar
  }
}
