"use client";

import { useMemo } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { normalizePlayerName, usePlayerName } from "@/lib/player-name";

/** Prefill de iniciales: localStorage → perfil (`displayName`) → INVITADO. */
export function useDefaultPlayerName(): string {
  const storedName = usePlayerName();
  const { user } = useAuth();
  const profileName = user?.displayName;

  return useMemo(() => {
    if (storedName) {
      return storedName;
    }
    if (profileName) {
      return normalizePlayerName(profileName);
    }
    return "INVITADO";
  }, [storedName, profileName]);
}
