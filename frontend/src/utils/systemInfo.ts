/**
 * @file systemInfo.ts
 * @module utils/systemInfo
 * @summary Runtime health probe against /api/health. Returns the database
 *   product reported by the backend, the build-time environment label, and
 *   the reported status — nothing the endpoint does not actually carry.
 *
 * @enterprise
 * - Sole production consumer: context/settings/SettingsContext.tsx.
 * - /api/health is the CUSTOM flat controller (not Spring Actuator):
 *   { status, database, databaseProduct, timestamp }. The previous
 *   Actuator-shaped 'ORACLE' substring heuristic could never match the real
 *   response and fabricated 'Local H2' / 'development' in production.
 * - database comes from the backend's databaseProduct field (JDBC metadata,
 *   e.g. "Oracle", "H2"); environment comes from config/appMeta
 *   (build-time truth, same source as footer and hamburger menu).
 * - No caching by design: the single consumer fetches once per mount.
 */

import { logError, logWarn } from './logger';
import { APP_ENVIRONMENT } from '../config/appMeta';

export interface SystemInfoResponse {
  status?: string;
  database?: string;
  databaseProduct?: string;
  timestamp?: number;
  [key: string]: unknown;
}

export const getSystemInfo = async () => {
  const fallback = {
    database: 'unknown',
    environment: APP_ENVIRONMENT,
    status: 'unknown' as const,
  };

  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logWarn(`Health endpoint returned status ${response.status}`);
      return fallback;
    }

    const data = (await response.json()) as SystemInfoResponse;

    const databaseProduct =
      typeof data.databaseProduct === 'string' && data.databaseProduct.trim() !== ''
        ? data.databaseProduct
        : 'unknown';

    return {
      database: databaseProduct,
      environment: APP_ENVIRONMENT,
      status: data.status || 'unknown',
    };
  } catch (error) {
    logError('Failed to fetch system info from health endpoint:', error);
    return fallback;
  }
};
