"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "./apiTypes";

export type { SessionUser };
export type UserRole = "listener" | "vtuber" | "supporter";

type UserSessionContextValue = {
  user: SessionUser | null;
  hydrated: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  isVtuber: boolean;
  isAdmin: boolean;
  login: (user: SessionUser) => void;
  updateUser: (updates: Partial<SessionUser>) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const UserSessionContext = createContext<UserSessionContextValue | null>(null);

export function UserSessionProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshSession = useCallback(async () => {
    let retrying = false;
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      // 429 = 回数制限（proxy.ts）。ログインが切れたわけではないので、ログアウト扱いにせず、
      // 制限が解ける時刻に聞き直す。それまでは hydrated を立てず「確認中（...）」のままにしておく
      // （ここで null にすると、ログイン中なのにヘッダーに「ログイン」ボタンが出てしまう）
      if (res.status === 429) {
        retrying = true;
        const resetAt = Number(res.headers.get("X-RateLimit-Reset"));
        const wait = Number.isFinite(resetAt) && resetAt > 0 ? Math.min(30_000, Math.max(1_000, resetAt - Date.now())) : 5_000;
        window.setTimeout(() => void refreshSession(), wait);
        return;
      }
      if (!res.ok) {
        // 4xx = genuine auth failure (no cookie / invalid) → log out
        // 5xx = server error (KV down, cold start, etc.) → keep existing state
        if (res.status >= 400 && res.status < 500) {
          setUser(null);
        }
        return;
      }
      const data = (await res.json()) as { user: SessionUser | null; isAuthenticated: boolean; isAdmin?: boolean };
      setUser(data.user ?? null);
      setIsAdmin(data.isAdmin ?? false);
    } catch {
      // Network error → keep existing state, don't log out
    } finally {
      if (!retrying) setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback((nextUser: SessionUser) => {
    setUser(nextUser);
  }, []);

  const updateUser = useCallback((updates: Partial<SessionUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates };
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      hydrated,
      loading: !hydrated,
      isAuthenticated: Boolean(user),
      isVtuber: user?.role === "vtuber",
      isAdmin,
      login,
      updateUser,
      logout,
      refreshSession,
    }),
    [hydrated, user, isAdmin, login, updateUser, logout, refreshSession],
  );

  return <UserSessionContext.Provider value={value}>{children}</UserSessionContext.Provider>;
}

export function useUserSession() {
  const ctx = useContext(UserSessionContext);
  if (!ctx) {
    throw new Error("useUserSession must be used inside UserSessionProvider");
  }
  return ctx;
}
