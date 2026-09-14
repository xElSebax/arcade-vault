"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getBrowserDisplayNameByUserId } from "@/lib/auth/profile.client";
import { normalizePlayerName } from "@/lib/player-name";
import { createClient } from "@/lib/supabase/client";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function fallbackDisplayName(email: string | undefined): string {
  const prefix = email?.split("@")[0]?.trim();
  if (prefix) {
    return normalizePlayerName(prefix);
  }
  return "PLAYER";
}

async function mapSupabaseUser(authUser: SupabaseUser): Promise<AuthUser> {
  const fromProfile = await getBrowserDisplayNameByUserId(authUser.id);
  const displayName = fromProfile
    ? normalizePlayerName(fromProfile)
    : fallbackDisplayName(authUser.email);

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    displayName,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySessionUser = useCallback(
    async (authUser: SupabaseUser | null) => {
      if (!authUser) {
        setUser(null);
        return;
      }
      const mapped = await mapSupabaseUser(authUser);
      setUser(mapped);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      setIsLoading(true);
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!active) return;
      await applySessionUser(authUser);
      if (active) setIsLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      setIsLoading(true);
      await applySessionUser(session?.user ?? null);
      if (active) setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, applySessionUser]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, signOut }),
    [user, isLoading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
