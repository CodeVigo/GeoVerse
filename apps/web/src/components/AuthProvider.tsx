"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiUpdateMe,
  type AuthUser,
} from "@/lib/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  setMode: (mode: "EXPLORE" | "EXAM") => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await apiMe();
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await apiLogin({ email, password });
    setUser(user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { user } = await apiRegister({ email, password, displayName });
      setUser(user);
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout().catch(() => {});
    setUser(null);
  }, []);

  const setMode = useCallback(async (mode: "EXPLORE" | "EXAM") => {
    const { user } = await apiUpdateMe({ preferredMode: mode });
    setUser(user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setMode, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
