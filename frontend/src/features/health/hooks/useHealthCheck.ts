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

/**
 * Health status structure returned by the hook.
 * Includes backend and database status, response time, and timestamp.
 * @enterprise
 * - Clear typing for health status
 * - Distinguishes between backend and database health
 * - Includes response time for performance monitoring
 * - Timestamp for last check
 */
export interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number;
  database: 'online' | 'offline';
  timestamp: number;
}

/**
 * Backend health response structure.
 * Used for runtime type checking of /api/health response.
 * @internal
 * - Ensures correct parsing of backend response
 * - Validates expected fields and types
 * - Prevents runtime errors from unexpected response shapes
 * - Aids in debugging health check issues
 */
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

/**
 * Hook to monitor backend health status.
 * Polls every 15 minutes or allows manual refresh.
 * @example
 * ```tsx
 * const { health, loading, refetch } = useHealthCheck();
 * ```
 */
export const useHealthCheck = () => {
  const [health, setHealth] = React.useState<HealthStatus>(DEFAULT_HEALTH);
  const [loading, setLoading] = React.useState(false);

  // Function to perform health check
  const checkHealth = React.useCallback(async () => {
    setLoading(true);

    // Measure start time
    try {
      const start = performance.now();

      const response = await fetch('/api/health', {
        credentials: 'include',
      });
      // Measure elapsed time
      const elapsed = Math.round(performance.now() - start);
      // Check HTTP status
      const contentType = response.headers.get('content-type') ?? '';
      // Ensure response is JSON
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.warn('Health endpoint returned non-JSON:', text);
        throw new Error('Backend health endpoint did not return JSON');
      }
      // Parse JSON response
      const parsed: unknown = await response.json();

      // Runtime type check to ensure parsed is BackendHealthResponse
      const isBackendHealthResponse = (
        obj: unknown
      ): obj is BackendHealthResponse => {
        if (typeof obj !== 'object' || obj === null) return false;
        // Check required fields
        const o = obj as Record<string, unknown>;
        // Validate field types
        return (
          typeof o.status === 'string' &&
          typeof o.database === 'string' &&
          typeof o.timestamp === 'number'
        );
      };
      // Validate parsed response structure
      if (!isBackendHealthResponse(parsed)) {
        console.error('Unexpected health response structure:', parsed);
        throw new Error('Health response does not match expected shape');
      }

      // Now parsed is fully typed ✔
      const backendVal = parsed.status.toLowerCase();
      const dbVal = parsed.database.toLowerCase();
      // Update health state based on response
      setHealth({
        status: backendVal === 'ok' ? 'online' : 'offline',
        database: dbVal === 'ok' ? 'online' : 'offline',
        responseTime: elapsed,
        timestamp: parsed.timestamp,
      });
    } catch (err) {
      console.error('Health check failed:', err);
      // On error, set health to offline
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
  // Initial check on mount
  React.useEffect(() => void checkHealth(), [checkHealth]);

  // Poll every 15 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      void checkHealth();
    }, 15 * 60 * 1000);
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, refetch: checkHealth };
};