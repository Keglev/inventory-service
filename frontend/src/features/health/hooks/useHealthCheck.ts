/**
 * @file useHealthCheck.ts
 * @module features/health/hooks
 * @summary Polls /api/health every 15 minutes; tracks backend + database online/offline + response time. Feeds 4 chrome surfaces.
 * @enterprise
 * - 4 production consumers — all chrome/layout surfaces: HealthStatusDisplay.tsx (footer), useFooterState.ts (footer state),
 *   SystemInfoMenuSection.tsx (hamburger), HealthBadge.tsx (header). Health status feeds the UI in 4 places.
 * - Uses raw `fetch` (not the project-standard httpClient) by INTENT: health probe must be interceptor-less to avoid
 *   feedback loops (httpClient has auth/error interceptors that would redirect, retry, or toast on health failures).
 *   Raw fetch isolates the probe from app-level error handling.
 * - 15-min poll interval is a balance between freshness and load. Manual refetch is exposed for UI-triggered refreshes
 *   (refresh button in HealthBadge etc.).
 * - Backend contract mismatch CONCERN: this hook expects a flat response shape (`status`, `database`, `timestamp`) that
 *   disagrees with MASTER's Spring Actuator LOCKED FACT (`status`, `components.db.*`). Sibling consumer
 *   utils/systemInfo.ts uses the same flat shape. If MASTER is right, all 4 consumers show "offline" perpetually. → CB-APP36.
 * - Catch-branch sets status: 'offline' on any exception (network, non-JSON, shape mismatch). UI must tolerate offline
 *   state as the normal failure mode.
 */

import * as React from 'react';
import { logError, logWarn } from '../../../utils/logger';

/** Health status structure returned by the hook. */
export interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  timestamp: number;
}

/** Expected /api/health response shape per current frontend assumption. See CB-APP36 — disagrees with MASTER LOCKED FACTS on backend Actuator format. */
interface BackendHealthResponse {
  status: string;     // expect "ok" or "down"
  database: string;   // expect "ok" or "down"
  timestamp: number;
}

/** Default offline health status. */
const DEFAULT_HEALTH: HealthStatus = {
  status: 'offline',
  responseTime: 0,
  database: 'offline',
  timestamp: 0,
};

/** Hook to monitor backend health; polls every 15 minutes, exposes manual refetch. */
export const useHealthCheck = () => {
  const [health, setHealth] = React.useState<HealthStatus>(DEFAULT_HEALTH);
  const [loading, setLoading] = React.useState(false);

  const checkHealth = React.useCallback(async () => {
    setLoading(true);

    try {
      const start = performance.now();

      const response = await fetch('/api/health', {
        credentials: 'include',
      });
      const elapsed = Math.round(performance.now() - start);
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        logWarn('Health endpoint returned non-JSON:', text);
        throw new Error('Backend health endpoint did not return JSON');
      }
      const parsed: unknown = await response.json();

      // WHY: response.json() is typed as `unknown`; without a runtime guard, a backend contract drift would propagate as undefined-field bugs downstream. Type guard catches drift at the parse boundary.
      const isBackendHealthResponse = (
        obj: unknown
      ): obj is BackendHealthResponse => {
        if (typeof obj !== 'object' || obj === null) return false;
        const o = obj as Record<string, unknown>;
        return (
          typeof o.status === 'string' &&
          typeof o.database === 'string' &&
          typeof o.timestamp === 'number'
        );
      };
      if (!isBackendHealthResponse(parsed)) {
        logError('Unexpected health response structure:', parsed);
        // WHY: shape mismatch is potentially CB-APP36 territory — frontend assumption may not match backend Actuator format; verification required.
        throw new Error('Health response does not match expected shape');
      }

      const backendVal = parsed.status.toLowerCase();
      const dbVal = parsed.database.toLowerCase();
      setHealth({
        status: backendVal === 'ok' ? 'online' : 'offline',
        database: dbVal === 'ok' ? 'online' : 'offline',
        responseTime: elapsed,
        timestamp: parsed.timestamp,
      });
    } catch (err) {
      logError('Health check failed:', err);
      setHealth({
        status: 'offline',
        responseTime: 0,
        database: 'offline',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => void checkHealth(), [checkHealth]);

  // WHY: 15-min cadence balances freshness for chrome indicators against polling load on the backend health endpoint.
  React.useEffect(() => {
    const interval = setInterval(() => {
      void checkHealth();
    }, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, refetch: checkHealth };
};