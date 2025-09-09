/**
 * @file AuthContext.tsx
 * @description
 * Authentication context for Smart Supply Pro.
 *
 * @responsibilities
 * - Hydrate session state on app start (GET /api/me).
 * - Expose { user, setUser, login, logout, loading } to the app.
 * - Provide a single source of truth for the authenticated user.
 *
 * @nonGoals
 * - No HTTP logout here (that is handled by the dedicated LogoutPage).
 * - No routing here (consumers navigate as needed).
 *
 * @enterprise
 * - Uses the same API base as the HTTP client for OAuth redirects.
 * - Supports cross-tab logout via a `localStorage` broadcast flag.
 */

import React, { createContext, useEffect, useMemo, useState } from 'react';
import type { AuthContextType, AppUser } from './authTypes';
import httpClient, { API_BASE } from '../api/httpClient';

const STORAGE_FLAG = 'ssp:forceLogout';

/**
 * Global authentication context.
 * @public
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component.
 * Wrap your application with this provider to access auth state via `useAuth()`.
 */
export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * One-time session hydration on app load.
   * - Attempts to fetch /api/me; on success, sets `user`.
   * - On 401/offline, user stays null.
   * - Uses AbortController for unmount safety.
   */
  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        const { data } = await httpClient.get<AppUser>('/api/me', {
          signal: ac.signal, // axios passes this through to fetch adapter
        });
        setUser({ email: data.email, fullName: data.fullName, role: data.role });
      } catch {
        // unauthenticated or network issue → user remains null
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  /**
   * Initiates Google OAuth2 on the backend (full-page redirect).
   * Uses the same base URL as the HTTP client to avoid mismatches.
   */
  const login = () => {
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  /**
   * Clears only the client-side user state.
   * - Does not call the server and does not navigate.
   * - Broadcasts a logout signal to other tabs.
   */
  const logout = () => {
    try {
      localStorage.setItem(STORAGE_FLAG, '1');
      localStorage.removeItem(STORAGE_FLAG); // keep storage clean
    } catch {
      // ignore storage failures
    }
    setUser(null);
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, setUser, login, logout, loading }),
    [user, loading]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};
