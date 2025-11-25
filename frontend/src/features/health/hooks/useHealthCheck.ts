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
import http from '../../../api/httpClient';

export interface HealthStatus {
  status: 'online' | 'offline';
  responseTime: number; // milliseconds
  database: 'online' | 'offline';
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
      const response = await http.get<{
        status: string;
        database: string;
        timestamp: number;
      }>('/health');
      const elapsed = Math.round(performance.now() - start);

      setHealth({
        status: response.data.status === 'ok' ? 'online' : 'offline',
        responseTime: elapsed,
        database: response.data.database === 'ok' ? 'online' : 'offline',
        timestamp: response.data.timestamp,
      });
    } catch (error) {
      console.error('Health check failed:', error);
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
  React.useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  // Periodic polling every 15 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      void checkHealth();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, loading, refetch: checkHealth };
};
