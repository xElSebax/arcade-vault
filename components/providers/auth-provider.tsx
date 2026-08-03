"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "av_user";
const AUTH_EVENT = "av-auth-change";

export interface User {
  name: string;
}

interface AuthContextValue {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeName(name: string): string {
  return (name || "PLAYER1").toUpperCase().slice(0, 10);
}

const readStoredUserCache: {
  raw: string | null | undefined;
  user: User | null;
} = { raw: undefined, user: null };

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === readStoredUserCache.raw) return readStoredUserCache.user;
    readStoredUserCache.raw = raw;
    if (!raw) {
      readStoredUserCache.user = null;
      return null;
    }
    const parsed = JSON.parse(raw) as User | null;
    if (parsed && typeof parsed.name === "string") {
      readStoredUserCache.user = parsed;
      return parsed;
    }
    readStoredUserCache.user = null;
    return null;
  } catch {
    readStoredUserCache.raw = undefined;
    readStoredUserCache.user = null;
    return null;
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(AUTH_EVENT, onStoreChange);
  return () => window.removeEventListener(AUTH_EVENT, onStoreChange);
}

function getServerSnapshot(): User | null {
  return null;
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribe,
    readStoredUser,
    getServerSnapshot,
  );

  const persist = useCallback((next: User | null) => {
    if (next) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    notifyAuthChange();
  }, []);

  const login = useCallback(
    (name: string) => {
      persist({ name: normalizeName(name) });
    },
    [persist],
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const loginAsGuest = useCallback(() => {
    persist(null);
  }, [persist]);

  const value: AuthContextValue = {
    user,
    login,
    logout,
    loginAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
