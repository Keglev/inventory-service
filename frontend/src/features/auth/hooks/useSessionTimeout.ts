/**
 * @file useSessionTimeout.ts
 * @module features/auth/hooks/useSessionTimeout
 * @summary
 * Proactive session management for authenticated layout: heartbeat /api/me on
 * visibility + interval, optional idle-timeout logout, cross-tab logout listener.
 *
 * @enterprise
 * - Single production consumer: app/layout/AppShell.tsx — mounted once inside
 *   the authenticated layout, options passed in. Covers all authenticated routes
 *   via the shell.
 * - Three concerns in three effects:
 *   (1) HEARTBEAT — pings pingEndpoint (default /api/me) on tab visibility +
 *       interval. DEMO sessions skip heartbeat entirely (no server cookie to
 *       validate). A 401/403/network failure forces /logout via
 *       forceLogoutAcrossTabs + navigate.
 *   (2) IDLE TIMEOUT (opt-in) — when enableIdleTimeout, resets a timer on
 *       mouse/keyboard/wheel/touch events; firing the timer forces /logout.
 *       OFF by default — enable for strict environments.
 *   (3) CROSS-TAB LISTENER — reacts to a `storage` event with key ===
 *       STORAGE_FLAG and newValue === '1' and navigates to /logout. THIS IS
 *       THE LISTENER for AuthContext's logout broadcast (CB-APP30 — answered;
 *       concern shifts to CB-APP38).
 * - Does NOT clear AuthContext state directly — navigates to /logout and lets
 *   LogoutPage own cleanup (HTTP logout + cookie revocation). Single source of
 *   truth for logout side effects.
 * - 'ssp:forceLogout' magic string is DUPLICATED with AuthContext.ts — see CB-APP38.
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import httpClient from '../../../api/httpClient';
import { useAuth } from '../../../hooks/useAuth';


type UseSessionTimeoutOptions = {
  /** Endpoint returning 200/OK when the session is valid (e.g., GET /api/me). */
  pingEndpoint?: string;
  /** How often to ping while the tab is visible. Default: 60s. */
  pingIntervalMs?: number;
  /** Whether to auto-logout after idle period. Default: false (off). */
  enableIdleTimeout?: boolean;
  /** Idle period before logout when `enableIdleTimeout` is true. Default: 15 min. */
  idleTimeoutMs?: number;
};

// BUCKET: 'ssp:forceLogout' magic string is duplicated in AuthContext.ts; extract to a shared constants module to prevent drift between broadcaster and listener (CB-APP38)
const STORAGE_FLAG = 'ssp:forceLogout';

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    pingEndpoint = '/api/me',
    pingIntervalMs = 60_000,
    enableIdleTimeout = false,
    idleTimeoutMs = 15 * 60_000,
  } = options;

  const navigate = useNavigate();
  // WHY: re-subscribe heartbeat/idle effects when isDemo flips (login/logout transitions) so DEMO short-circuits apply correctly.
  const { user } = useAuth();

  // ---- Heartbeat: detect server-side invalidation ----
  React.useEffect(() => {
    let timer: number | null = null;
    // DEMO sessions have no server cookie/token; skip heartbeat entirely
    if (user?.isDemo) return;

    const ping = async () => {
      try {
        await httpClient.get(pingEndpoint, { withCredentials: true });
      } catch {
        // Likely 401/403/network -> force logout route (centralized cleanup there)
        forceLogoutAcrossTabs();
        navigate('/logout', { replace: true });
      }
    };

    const start = () => {
      // immediate check when becoming visible
      ping();
      timer = window.setInterval(ping, pingIntervalMs);
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

    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility(); // initialize

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stop();
    };
  }, [user?.isDemo, pingEndpoint, pingIntervalMs, navigate]);

  // ---- Idle timeout (optional) ----
  React.useEffect(() => {

    if (!enableIdleTimeout || user?.isDemo) return;

    let idleTimer: number;

    const resetIdle = () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        forceLogoutAcrossTabs();
        navigate('/logout', { replace: true });
      }, idleTimeoutMs);
    };

    const events = ['mousemove', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();

    return () => {
      if (idleTimer) window.clearTimeout(idleTimer);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [enableIdleTimeout, idleTimeoutMs, user?.isDemo, navigate]);

  // ---- Cross-tab sync for logout ----
  React.useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_FLAG && ev.newValue === '1') {
        // WHY: AuthContext.logout in another tab wrote STORAGE_FLAG=1; mirror the navigation here so all tabs converge on /logout.
        navigate('/logout', { replace: true });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);
}

/** Broadcast a /logout signal to other tabs via the STORAGE_FLAG localStorage write+delete pattern. Caller is responsible for navigating this tab. */
function forceLogoutAcrossTabs() {
  try {
    localStorage.setItem(STORAGE_FLAG, '1');
    // clear quickly to keep storage clean while still triggering event
    localStorage.removeItem(STORAGE_FLAG);
  } catch {
    // ignore storage failures
  }
}
