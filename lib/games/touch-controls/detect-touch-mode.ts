"use client";

import { useSyncExternalStore } from "react";

const TOUCH_MODE_QUERY = "(pointer: coarse)";
const MOBILE_MAX_WIDTH = 768;

function getTouchPlayModeSnapshot(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia(TOUCH_MODE_QUERY).matches ||
    window.innerWidth < MOBILE_MAX_WIDTH
  );
}

function subscribeToTouchPlayMode(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(TOUCH_MODE_QUERY);
  const handleChange = () => onStoreChange();

  mediaQuery.addEventListener("change", handleChange);
  window.addEventListener("resize", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
    window.removeEventListener("resize", handleChange);
  };
}

/** true cuando debe mostrarse la barra inferior de controles virtuales */
export function isTouchPlayMode(): boolean {
  return getTouchPlayModeSnapshot();
}

export function useTouchPlayMode(): boolean {
  return useSyncExternalStore(
    subscribeToTouchPlayMode,
    getTouchPlayModeSnapshot,
    () => false,
  );
}
