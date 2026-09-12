"use client";

import { useEffect } from "react";

/**
 * Hides site chrome (nav/footer) and locks page scroll while touch play is active.
 * Adds `av-touch-play--overlay` when pause or game over overlays are open.
 */
export function useTouchPlayChrome(
  enabled: boolean,
  overlayOpen: boolean,
): void {
  useEffect(() => {
    const root = document.documentElement;

    if (!enabled) {
      root.classList.remove("av-touch-play", "av-touch-play--overlay");
      return;
    }

    root.classList.add("av-touch-play");

    return () => {
      root.classList.remove("av-touch-play", "av-touch-play--overlay");
    };
  }, [enabled]);

  useEffect(() => {
    const root = document.documentElement;

    if (!enabled) {
      return;
    }

    if (overlayOpen) {
      root.classList.add("av-touch-play--overlay");
    } else {
      root.classList.remove("av-touch-play--overlay");
    }
  }, [enabled, overlayOpen]);
}
