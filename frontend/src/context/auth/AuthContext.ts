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

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthContextType, AppUser } from './authTypes';
import httpClient, { API_BASE } from '../../api/httpClient';
import { FORCE_LOGOUT_FLAG } from './storageKeys';

const DEMO_KEY = 'ssp.demo.session';
/** Ceiling for the logout-in-progress guard: long enough for any POST-form redirect to land, short enough that a stalled redirect cannot lock the auth guards. */
const LOGOUT_GUARD_MS = 4000;

/**
 * Global authentication context.
 * @public
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logoutInProgress, setLogoutInProgress] = useState<boolean>(false);
  const logoutTimerRef = useRef<number | null>(null);

  /** One-time session hydration: tries DEMO first, then /api/me. */
  useEffect(() => {
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
      // WHY: localStorage can throw (Safari private mode, quota exceeded, disabled storage) or hold corrupt JSON from prior versions; either failure must not block server hydration.
    }

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

  const login = () => {
    const origin = window.location.origin;
    const url = `${API_BASE}/oauth2/authorization/google?return=${encodeURIComponent(origin)}`;
    window.location.assign(url);
  };

  const loginAsDemo = () => {
    const demoUser: AppUser = {
      email: 'demo@smartsupplypro.local',
      fullName: 'Demo User',
      role: 'DEMO',
      isDemo: true,
    };
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(demoUser));
    } catch {
      // WHY: storage failures (private mode, quota) are tolerable — in-memory user state still works; deep-link persistence is best-effort.
    }
    setUser(demoUser);
  };

  const logout = () => {
    setLogoutInProgress(true);
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    try {
      localStorage.setItem(FORCE_LOGOUT_FLAG, '1');
      localStorage.removeItem(FORCE_LOGOUT_FLAG);
      localStorage.removeItem(DEMO_KEY);
    } catch {
      // ignore storage failures
    }
    setUser(null);
    // WHY: prevents auth-guard flicker if navigation/redirect stalls after logout — flag must eventually drop.
    logoutTimerRef.current = window.setTimeout(() => setLogoutInProgress(false), LOGOUT_GUARD_MS);
  };

  // WHY: a successful re-login (server or demo) after logout must clear logoutInProgress so guards stop suppressing routes; also cancels any pending safety-valve timer.
  useEffect(() => {
    if (user) {
      setLogoutInProgress(false);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
  }, [user]);

  // WHY: on unmount, clear the safety-valve timer so it never fires against a stale state setter.
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
