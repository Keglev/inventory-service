/**
 * @file systemInfo.ts
 * @module utils/systemInfo
 * @summary Runtime health probe against /api/health. Returns the detected
 *   database flavor (Oracle ADB vs Local H2), a derived environment label,
 *   and the reported status — nothing the endpoint does not actually carry.
 *
 * @enterprise
 * - Sole production consumer: context/settings/SettingsContext.tsx.
 * - /api/health is Spring Actuator standard: status + components.db.*. It does
 *   NOT return version, commit hash, build date, or uptime; build-time app
 *   metadata comes from config/appMeta instead.
 * - DB detection is a substring-match heuristic: 'ORACLE' anywhere in the
 *   stringified response → Oracle ADB; otherwise Local H2. Acceptable for the
 *   current closed two-DB set; not a long-term contract.
 * - environment is DERIVED from DB flavor (Oracle → 'production'), not from a
 *   real environment signal.
 * - No caching by design: the single consumer fetches once per mount.
 */

import { logError, logWarn } from './logger';

export interface SystemInfoResponse {
  status: string;
  components?: {
    db?: {
      status: string;
      details?: {
        database?: string;
        [key: string]: unknown;
      };
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

const detectDatabase = (healthResponse: unknown): string => {
  try {
    const response = healthResponse as SystemInfoResponse;

    // WHY: closed two-DB set means any 'ORACLE' substring in the full response reliably identifies Oracle ADB.
    const responseString = JSON.stringify(response).toUpperCase();
    if (responseString.includes('ORACLE')) {
      return 'Oracle ADB';
    }

    if (response.components?.db?.details?.database) {
      const db = response.components.db.details.database.toUpperCase();
      if (db.includes('ORACLE')) {
        return 'Oracle ADB';
      }
    }

    return 'Local H2';
  } catch {
    return 'Local H2';
  }
};

export const getSystemInfo = async () => {
  const fallback = {
    database: 'Local H2',
    environment: 'development',
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

    const database = detectDatabase(data);
    const environment = database === 'Oracle ADB' ? 'production' : 'development';

    return {
      database,
      environment,
      status: data.status || 'UP',
    };
  } catch (error) {
    logError('Failed to fetch system info from health endpoint:', error);
    return fallback;
  }
};
