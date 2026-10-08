/**
 * @file useHealthCheck.ts
 * @module features/health/hooks
 * @summary One shared /api/health probe (React Query, refreshed every 15 minutes): backend and
 * database online/offline, response time and the database product name.
 * @enterprise
 * - One source for every chrome surface (header badge, footer, About dialog; FW5 fork 3).
 *   The query key dedupes them: before, each consumer ran its own fetch and timer, so entering
 *   the demo sent two simultaneous requests and the settings context a third.
 * - Uses raw `fetch` (not the project-standard httpClient) by INTENT: health probe must be interceptor-less to avoid
 *   feedback loops (httpClient has auth/error interceptors that would redirect, retry, or toast on health failures).
 *   Raw fetch isolates the probe from app-level error handling.
 * - The URL still comes from VITE_API_BASE via api/apiBase, so the probe targets the same backend as every other
 *   request. A relative path followed the serving origin instead: the static server under `vite preview`, and the
 *   production backend behind the dev proxy.
 * - Refresh: every 15 minutes while a consumer is mounted, on mount when the cached result is older than the app's
 *   default stale time (60 s, main.tsx), and on demand through refetch(). No window-focus refetch.
 * - Backend contract (verified against source): /api/health returns a flat JSON body
 *   ({status, database, databaseProduct, timestamp}), 200/503.
 * - The probe never throws: any failure (network, non-JSON, shape mismatch) resolves to an offline status, so
 *   React Query's retry never fires and the UI treats offline as the normal failure mode.
 */

import { useQuery } from '@tanstack/react-query';
import { apiUrl } from '../../../api/apiBase';
import { logError, logWarn } from '../../../utils/logger';

/** Health status structure returned by the hook. */
export interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  /** Database product as the backend reports it (JDBC metadata), or null when unknown. */
  databaseProduct: string | null;
  timestamp: number;
}

/** /api/health response shape, verified against the backend controller (flat JSON, not Actuator format). */
interface BackendHealthResponse {
  status: string;     // expect "ok" or "down"
  database: string;   // expect "ok" or "down"
  databaseProduct?: unknown;
  timestamp: number;
}

/** Default offline health status (also the value before the first probe resolves). */
const DEFAULT_HEALTH: HealthStatus = {
  status: 'offline',
  responseTime: 0,
  database: 'offline',
  databaseProduct: null,
  timestamp: 0,
};

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/** React Query key of the shared probe; every consumer uses it, so they share one request. */
const HEALTH_QUERY_KEY = ['health'] as const;

// WHY: response.json() is typed as `unknown`; without a runtime guard, a backend contract drift would
// propagate as undefined-field bugs downstream. The guard catches drift at the parse boundary.
const isBackendHealthResponse = (obj: unknown): obj is BackendHealthResponse => {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.status === 'string' && typeof o.database === 'string' && typeof o.timestamp === 'number';
};

/** Runs one probe; resolves to an offline status instead of rejecting. */
async function probeHealth(): Promise<HealthStatus> {
  try {
    const start = performance.now();
    const response = await fetch(apiUrl('/api/health'), {
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
    if (!isBackendHealthResponse(parsed)) {
      logError('Unexpected health response structure:', parsed);
      throw new Error('Health response does not match expected shape');
    }

    const product =
      typeof parsed.databaseProduct === 'string' && parsed.databaseProduct.trim() !== ''
        ? parsed.databaseProduct
        : null;

    return {
      status: parsed.status.toLowerCase() === 'ok' ? 'online' : 'offline',
      database: parsed.database.toLowerCase() === 'ok' ? 'online' : 'offline',
      databaseProduct: product,
      responseTime: elapsed,
      timestamp: parsed.timestamp,
    };
  } catch (err) {
    logError('Health check failed:', err);
    return { ...DEFAULT_HEALTH, timestamp: Date.now() };
  }
}

/** Shared backend health; polls every 15 minutes while mounted, exposes manual refetch. */
export const useHealthCheck = () => {
  const query = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: probeHealth,
    refetchInterval: FIFTEEN_MINUTES,
    refetchOnWindowFocus: false,
  });

  const refetch = async (): Promise<void> => {
    await query.refetch();
  };

  return { health: query.data ?? DEFAULT_HEALTH, loading: query.isFetching, refetch };
};
