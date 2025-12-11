/**
 * @file AuthContext.ts
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
 * - DEMO session is persisted to localStorage to enable deep-links (/analytics/...).
 */

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthContextType, AppUser } from './authTypes';
import httpClient, { API_BASE } from '../../api/httpClient';

const STORAGE_FLAG = 'ssp:forceLogout';
const DEMO_KEY = 'ssp.demo.session'; // ✨ NEW

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
  const [logoutInProgress, setLogoutInProgress] = useState<boolean>(false);
  const logoutTimerRef = useRef<number | null>(null);

  /**
   * One-time session hydration on app load.
   * Order:
   * 1) If a DEMO session exists, restore it and skip network.
   * 2) Otherwise, try /api/me (server session).
   */
  useEffect(() => {
    // 1) Try restoring demo first
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) {
        const demo = JSON.parse(raw) as AppUser | null;
        if (demo && demo.isDemo) {
          setUser(demo);
          setLoading(false);
          return; // short-circuit: demo sessions don't call /api/me
        }
      }
    } catch {
      // ignore bad JSON or storage unavailability
    }

    // 2) Fall back to server hydration (/api/me)
    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await httpClient.get<AppUser>('/api/me', { signal: ac.signal });
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
   * Includes return URL to redirect back to AuthCallback after successful authentication.
   */
  const login = () => {
    const origin = window.location.origin;
    const url = `${API_BASE}/oauth2/authorization/google?return=${encodeURIComponent(origin)}`;
    window.location.assign(url);
  };

  /**
   * Starts a client-only DEMO session.
   * - No network calls; sets a synthetic user with role "DEMO".
   * - Persists to localStorage for deep-links.
   */
  const loginAsDemo = () => {
    const demoUser: AppUser = {
      email: 'demo@smartsupplypro.local',
      fullName: 'Demo User',
      role: 'DEMO',
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
    } catch {/* ignore storage failures */}
    setUser(demoUser);
  };

  /**
   * Clears only the client-side user state.
   * - Broadcasts a logout signal to other tabs.
   * - Removes DEMO persistence if present.
   */
  const logout = () => {
    // Debug: auth.logout invoked
    // eslint-disable-next-line no-console
    console.debug('[AuthContext] logout() called');
    setLogoutInProgress(true);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    try {
      localStorage.setItem(STORAGE_FLAG, '1');
      localStorage.removeItem(STORAGE_FLAG);
      localStorage.removeItem(DEMO_KEY); // ✨ ensure demo session is cleared
    } catch {
      // ignore storage failures
    }
    setUser(null);
    // Safety valve: clear the in-progress flag after a short interval in case navigation stalls
    logoutTimerRef.current = window.setTimeout(() => setLogoutInProgress(false), 4000);
  };

  // If a user is set (hydration or login), ensure we drop any stale logout flag
  useEffect(() => {
    if (user) {
      setLogoutInProgress(false);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
  }, [user]);

  useEffect(() => () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, setUser, login, loginAsDemo, logout, loading, logoutInProgress }),
    [user, loading, logoutInProgress]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};
