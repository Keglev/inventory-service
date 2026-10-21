/**
 * @file AuthContext.ts
 * @module context/auth
 * @summary
 * AuthProvider component owning the dual-session auth model (server
 * /api/me + client-only DEMO) plus cross-tab logout broadcast.
 *
 * @enterprise
 * - Dual session model:
 *   (1) DEMO session, client-only, persisted to localStorage under
 *       'ssp.demo.session'; enables deep-links for recruiter/portfolio
 *       walkthroughs without backend.
 *   (2) SERVER session, hydrated via GET /api/me on app start using
 *       the shared httpClient (cookie auth). On success, the response
 *       is narrowed: only email/fullName/role are copied to local
 *       state — isDemo is intentionally dropped (server sessions are
 *       never demo).
 * - Hydration order: DEMO check first, then /api/me. Demo
 *   short-circuits the network call.
 * - OAuth2 login() redirects to backend with `return=origin`. The
 *   backend validates that origin against an allow-list before its
 *   success redirect to /auth (NOT /dashboard).
 * - Logout is CLIENT-ONLY here. HTTP logout (cookie revocation) is
 *   owned by LogoutPage. logout() clears local state and broadcasts
 *   to other tabs via the 'ssp:forceLogout' localStorage write+delete
 *   pattern (storage events fire only in OTHER tabs).
 * - File is .ts (not .tsx) by intent: uses React.createElement for
 *   the Provider return so no JSX pragma is needed. AuthProvider.tsx
 *   is a re-export shim giving consumers a .tsx import surface.
 * - logoutInProgress is a UX flag (4s safety-valve timer) to prevent
 *   auth-guard flicker between local clear and the subsequent
 *   navigation/redirect.
 */

import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthContextType, AppUser } from './authTypes';
import httpClient from '../../api/httpClient';
import { apiUrl } from '../../api/apiBase';
import { DEMO_SESSION_KEY, FORCE_LOGOUT_FLAG } from '../../config/storageKeys';
import { readDemoSession } from './demoSession';

/** Ceiling for the logout-in-progress guard: long enough for any POST-form redirect to land, short enough that a stalled redirect cannot lock the auth guards. */
const LOGOUT_GUARD_MS = 4000;

/**
 * Global authentication context.
 * @public
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  // A stored demo session is read once, during the first render, so that render
  // already has the user and no effect has to set it.
  const [initialDemo] = useState(readDemoSession);
  const [user, setUserState] = useState<AppUser | null>(initialDemo);
  const [loading, setLoading] = useState<boolean>(initialDemo === null);
  const [logoutInProgress, setLogoutInProgress] = useState<boolean>(false);
  const logoutTimerRef = useRef<number | null>(null);

  // WHY: a successful re-login (server or demo) after logout must clear
  // logoutInProgress so guards stop suppressing routes, and cancel the pending
  // safety-valve timer. Done where a user is set rather than in an effect on
  // user, which rendered once more with the stale flag.
  const setUser = useCallback((next: AppUser | null) => {
    if (next) {
      setLogoutInProgress(false);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
    setUserState(next);
  }, []);

  /** One-time server-session hydration via /api/me; a demo session skips it. */
  useEffect(() => {
    if (initialDemo) return; // demo sessions don't call /api/me

    const ac = new AbortController();
    (async () => {
      try {
        const { data } = await httpClient.get<AppUser>('/api/me', { signal: ac.signal });
        setUser({ email: data.email, fullName: data.fullName, role: data.role });
      } catch {
        // unauthenticated or network issue -> user remains null
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [initialDemo, setUser]);

  const login = () => {
    const origin = window.location.origin;
    const url = apiUrl(`/oauth2/authorization/google?return=${encodeURIComponent(origin)}`);
    window.location.assign(url);
  };

  const loginAsDemo = useCallback(() => {
    const demoUser: AppUser = {
      email: 'demo@smartsupplypro.local',
      fullName: 'Demo User',
      role: 'DEMO',
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
    } catch {
      // WHY: storage failures (private mode, quota) are tolerable — in-memory user state still works; deep-link persistence is best-effort.
    }
    setUser(demoUser);
  }, [setUser]);

  const logout = () => {
    setLogoutInProgress(true);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    try {
      localStorage.setItem(FORCE_LOGOUT_FLAG, '1');
      localStorage.removeItem(FORCE_LOGOUT_FLAG);
      localStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // ignore storage failures
    }
    setUserState(null);
    // WHY: prevents auth-guard flicker if navigation/redirect stalls after logout — flag must eventually drop.
    logoutTimerRef.current = window.setTimeout(() => setLogoutInProgress(false), LOGOUT_GUARD_MS);
  };

  // WHY: on unmount, clear the safety-valve timer so it never fires against a stale state setter.
  useEffect(() => () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({ user, setUser, login, loginAsDemo, logout, loading, logoutInProgress }),
    [user, setUser, loginAsDemo, loading, logoutInProgress]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
};
