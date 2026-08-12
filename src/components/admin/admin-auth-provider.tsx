"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { ApiRequestError } from "@/lib/api/errors";
import { decodeJwtPayload } from "@/lib/jwt";
import type { AdminUser, LoginResponse, RefreshResponse } from "@/lib/api/types";

interface AccessTokenClaims {
  propertyScopeId: string | null;
}

function withScope(admin: Omit<AdminUser, "propertyScopeId">, accessToken: string): AdminUser {
  const claims = decodeJwtPayload<AccessTokenClaims>(accessToken);
  return { ...admin, propertyScopeId: claims?.propertyScopeId ?? null };
}

export type AuthedFetch = <T>(path: string, init?: RequestInit) => Promise<T>;

interface StoredAuth {
  admin: AdminUser;
  accessToken: string;
  refreshToken: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authedFetch: AuthedFetch;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);
const STORAGE_KEY = "mansello_admin_auth";

function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // localStorage isn't available during SSR, so auth state must start
    // empty on the server and sync in after mount, same as the cart.
    const stored = readStoredAuth();
    if (stored) {
      accessTokenRef.current = stored.accessToken;
      refreshTokenRef.current = stored.refreshToken;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAdmin(stored.admin);
    }
    setLoading(false);
  }, []);

  const persist = useCallback((data: StoredAuth | null) => {
    if (data) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      accessTokenRef.current = data.accessToken;
      refreshTokenRef.current = data.refreshToken;
      setAdmin(data.admin);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
      accessTokenRef.current = null;
      refreshTokenRef.current = null;
      setAdmin(null);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<LoginResponse>("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persist({ ...result, admin: withScope(result.admin, result.accessToken) });
    },
    [persist]
  );

  const logout = useCallback(() => persist(null), [persist]);

  const authedFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      if (!accessTokenRef.current) throw new ApiRequestError(401, "unauthorized", "Not signed in");

      const withAuth = (token: string): RequestInit => ({
        ...init,
        headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      });

      try {
        return await apiFetch<T>(path, withAuth(accessTokenRef.current));
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401 && refreshTokenRef.current) {
          try {
            const refreshed = await apiFetch<RefreshResponse>("/api/admin/refresh", {
              method: "POST",
              body: JSON.stringify({ refreshToken: refreshTokenRef.current }),
            });
            if (admin) persist({ admin, ...refreshed });
            return await apiFetch<T>(path, withAuth(refreshed.accessToken));
          } catch {
            persist(null);
            throw err;
          }
        }
        if (err instanceof ApiRequestError && err.status === 401) persist(null);
        throw err;
      }
    },
    [admin, persist]
  );

  const value = useMemo<AdminAuthState>(
    () => ({ admin, loading, login, logout, authedFetch }),
    [admin, loading, login, logout, authedFetch]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}
