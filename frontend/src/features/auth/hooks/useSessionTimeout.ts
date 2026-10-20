/**
 * @file useSessionTimeout.ts
 * @module features/auth/hooks/useSessionTimeout
 * @summary
 * Proactive session management for the authenticated layout: an activity-aware
 * heartbeat on /api/me and the cross-tab logout listener.
 *
 * @enterprise
 * - Single production consumer: app/layout/AppShell.tsx — mounted once inside
 *   the authenticated layout. Covers all authenticated routes via the shell.
 * - Two concerns in two effects:
 *   (1) HEARTBEAT — pings pingEndpoint (default /api/me) when the tab becomes
 *       visible, then on an interval only if the user did something since the
 *       last ping. An idle tab sends nothing, so the server's session timeout
 *       ends an unattended session; the next ping after the user returns gets
 *       the 401. DEMO sessions skip it (no server session). Only a 401
 *       navigates to /logout; a network error, timeout or 5xx keeps the
 *       session and the next ping asks again.
 *   (2) CROSS-TAB LISTENER — reacts to a `storage` event with key ===
 *       FORCE_LOGOUT_FLAG and newValue === '1' and navigates to /logout. THIS IS
 *       THE LISTENER for AuthContext's logout broadcast.
 * - Does NOT clear AuthContext state directly — navigates to /logout and lets
 *   LogoutPage own cleanup (HTTP logout + cookie revocation). Single source of
 *   truth for logout side effects.
 * - FORCE_LOGOUT_FLAG is shared with AuthContext.ts via config/storageKeys.
 */

import * as React from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import httpClient from '../../../api/httpClient';
import { useAuth } from '../../../hooks/useAuth';
import { FORCE_LOGOUT_FLAG } from '../../../config/storageKeys';


type UseSessionTimeoutOptions = {
  /** Endpoint returning 200/OK when the session is valid (e.g., GET /api/me). */
  pingEndpoint?: string;
  /** How often to check while the tab is visible. Default: 60s. */
  pingIntervalMs?: number;
};

/** Input that counts as the user being present. */
const ACTIVITY_EVENTS = ['pointerdown', 'mousemove', 'keydown', 'wheel', 'touchstart'] as const;

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const { pingEndpoint = '/api/me', pingIntervalMs = 60_000 } = options;

  const navigate = useNavigate();
  // WHY: re-subscribe the heartbeat when isDemo flips (login/logout transitions) so the DEMO short-circuit applies correctly.
  const { user } = useAuth();

  // ---- Heartbeat: detect server-side invalidation ----
  // Every request refreshes the server session, so a ping on a timer kept an
  // unattended tab signed in forever. The interval pings only when the user
  // did something since the last ping; the server's session timeout (Spring
  // Boot's 30 min) is then the one idle limit, shared by all tabs because
  // they share the session (fork 10 C).
  React.useEffect(() => {
    let timer: number | null = null;
    let activeSinceLastPing = false;
    // DEMO sessions have no server cookie/token; skip heartbeat entirely
    if (user?.isDemo) return;

    const markActive = () => {
      activeSinceLastPing = true;
    };

    const ping = async () => {
      activeSinceLastPing = false;
      try {
        // httpClient sends the session cookie by default (withCredentials).
        await httpClient.get(pingEndpoint);
      } catch (error) {
        // WHY: only the server saying the session is gone ends it. Offline, a
        // timeout or a 5xx says nothing about the session, and ending it there
        // logged the user out in every tab on a network blip.
        if (!isAxiosError(error) || error.response?.status !== 401) return;
        // LogoutPage calls AuthContext.logout, which tells the other tabs.
        navigate('/logout', { replace: true });
      }
    };

    const pingIfActive = () => {
      if (activeSinceLastPing) void ping();
    };

    const start = () => {
      // Opening the app or returning to the tab is the user acting: check now.
      void ping();
      timer = window.setInterval(pingIfActive, pingIntervalMs);
    };
    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    // WHY: pause heartbeat while tab is hidden — avoids ping load + reduces noise from background tabs that may have already lost session.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility(); // initialize

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
  }, [user?.isDemo, pingEndpoint, pingIntervalMs, navigate]);

  // ---- Cross-tab sync for logout ----
  React.useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === FORCE_LOGOUT_FLAG && ev.newValue === '1') {
        // WHY: AuthContext.logout in another tab wrote FORCE_LOGOUT_FLAG=1; mirror the navigation here so all tabs converge on /logout.
        navigate('/logout', { replace: true });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);
}
