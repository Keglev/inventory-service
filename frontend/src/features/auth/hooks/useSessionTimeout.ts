/**
 * @file useSessionTimeout.ts
 * @description
 * Proactive session management hook. Detects expired/invalid sessions and
 * navigates the user to the dedicated logout flow.
 *
 * @enterprise
 * - Dual strategy:
 *   1) **Heartbeat**: ping a lightweight endpoint (e.g., `/api/me`) on a schedule
 *      and when the tab becomes visible to detect server-side session invalidation.
 *   2) **Idle timeout (optional)**: if enabled, logs the user out after a period
 *      of user inactivity (keyboard/mouse). This is off by default; enable for
 *      stricter environments.
 * - Cross-tab sync: leverages `storage` events to ensure logout across tabs.
 * - Does not throw UI; it **navigates to `/logout`** (LogoutPage does the cleanup).
 *
 * @usage
 * Call once inside your authenticated layout (e.g., `AppShell`) or an auth gate:
 *
 * ```tsx
 * useSessionTimeout({
 *   pingEndpoint: '/api/me',
 *   pingIntervalMs: 60_000,
 *   enableIdleTimeout: false,
 *   idleTimeoutMs: 15 * 60_000,
 * });
 * ```
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import httpClient from '../../../api/httpClient';

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

const STORAGE_FLAG = 'ssp:forceLogout';

export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    pingEndpoint = '/api/me',
    pingIntervalMs = 60_000,
    enableIdleTimeout = false,
    idleTimeoutMs = 15 * 60_000,
  } = options;

  const navigate = useNavigate();

  // ---- Heartbeat: detect server-side invalidation ----
  React.useEffect(() => {
    let timer: number | null = null;

    const ping = async () => {
      try {
        await httpClient.get(pingEndpoint, { withCredentials: true });
        // session valid -> nothing to do
      } catch {
        // Likely 401/403/network -> force logout route (centralized cleanup there)
        forceLogoutAcrossTabs();
        navigate('/logout', { replace: true });
      }
    };

    const start = () => {
      // immediate check when becoming visible
      ping();
      // periodic checks while visible
      timer = window.setInterval(ping, pingIntervalMs);
    };
    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    // Run heartbeat only when tab is visible (saves resources)
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
  }, [pingEndpoint, pingIntervalMs, navigate]);

  // ---- Idle timeout (optional) ----
  React.useEffect(() => {
    if (!enableIdleTimeout) return;

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
  }, [enableIdleTimeout, idleTimeoutMs, navigate]);

  // ---- Cross-tab sync for logout ----
  React.useEffect(() => {
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_FLAG && ev.newValue === '1') {
        // Another tab triggered logout; follow suit.
        navigate('/logout', { replace: true });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [navigate]);
}

/**
 * Signal all tabs to navigate to /logout via localStorage event.
 */
function forceLogoutAcrossTabs() {
  try {
    localStorage.setItem(STORAGE_FLAG, '1');
    // clear quickly to keep storage clean while still triggering event
    localStorage.removeItem(STORAGE_FLAG);
  } catch {
    // ignore storage failures
  }
}
