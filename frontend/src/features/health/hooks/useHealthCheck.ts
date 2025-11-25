/**
 * @file useHealthCheck.ts
 * @description
 * Custom hook to monitor backend health status.
 * Polls /api/health endpoint every 15 minutes and tracks:
 * - Backend status (Online/Offline)
 * - Response time (ms)
 * - Database status
 *
 * @enterprise
 * - Lightweight polling (15 min interval to reduce server load)
 * - Graceful error handling (offline state on connection error)
 * - Initial check on mount, then periodic polling
 */

import * as React from 'react';

export interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  timestamp: number;
}

interface BackendHealthResponse {
  status: string;     // expect "ok" or "down"
  database: string;   // expect "ok" or "down"
  timestamp: number;
}

const DEFAULT_HEALTH: HealthStatus = {
  status: 'offline',
  responseTime: 0,
  database: 'offline',
  timestamp: 0,
};

/**
 * Hook to monitor backend health status.
 * Polls every 15 minutes or allows manual refresh.
 */
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
        console.warn('Health endpoint returned non-JSON:', text);

        throw new Error('Backend health endpoint did not return JSON');
      }

      const parsed: unknown = await response.json();

      // Runtime type check to ensure parsed is BackendHealthResponse
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
        console.error('Unexpected health response structure:', parsed);
        throw new Error('Health response does not match expected shape');
      }

      // Now parsed is fully typed ✔
      const backendVal = parsed.status.toLowerCase();
      const dbVal = parsed.database.toLowerCase();

      setHealth({
        status: backendVal === 'ok' ? 'online' : 'offline',
        database: dbVal === 'ok' ? 'online' : 'offline',
        responseTime: elapsed,
        timestamp: parsed.timestamp,
      });
    } catch (err) {
      console.error('Health check failed:', err);

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

  React.useEffect(() => {
    const interval = setInterval(() => {
      void checkHealth();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, refetch: checkHealth };
};