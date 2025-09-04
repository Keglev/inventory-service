// src/context/AuthContext.tsx
import React, { createContext, useEffect, useMemo, useState } from "react";
import type { AuthContextType, AppUser } from "./authTypes";
import httpClient from "../api/httpClient";

/**
 * AuthContext (front-end)
 *
 * - Hydrates the session once via GET /api/me.
 * - Exposes { user, setUser, login, logout, loading }.
 * - login(): full-page redirect to backend /oauth2/authorization/google.
 * - logout(): client-only clear; caller performs API logout + navigation.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // One-time session hydration on app load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get("/api/me");
        if (!cancelled) {
          setUser({ email: data.email, fullName: data.fullName, role: data.role });
        }
      } catch {
        // unauthenticated/offline — remain null
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /** Starts Google OAuth2 via backend. */
  const login = () => {
    // Prefer the same base your httpClient uses.
    const base = (import.meta as ImportMeta).env?.VITE_API_BASE || "https://inventoryservice.fly.dev";
    window.location.href = `${base}/oauth2/authorization/google`;
  };

  /** Clear only the client-side user state (no HTTP, no navigation). */
  const logout = () => setUser(null);

  const value = useMemo<AuthContextType>(
    () => ({ user, setUser, login, logout, loading }),
    [user, loading]
  );

  // using createElement keeps eslint react-refresh rule quiet in some setups
  return React.createElement(AuthContext.Provider, { value }, children);
};
