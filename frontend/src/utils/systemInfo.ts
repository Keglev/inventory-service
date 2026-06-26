/**
 * @file systemInfo.ts
 * @module utils/systemInfo
 * @summary Runtime health probe against /api/health. Returns the detected database
 *   flavor (Oracle ADB vs Local H2) and a small set of derived fields. Build-time
 *   app metadata (version, commit hash, environment) does not belong here — see
 *   CB-APP1 for the build-time channel.
 *
 * @enterprise
 * - Sole production consumer: context/settings/SettingsContext.tsx. Other surfaces
 *   that display environment/version values (footer, SidebarEnvironment,
 *   SystemInfoMenuSection) hardcode those values and do not call this function —
 *   tracked under CB-APP1.
 * - /api/health is Spring Actuator standard: returns status + components.db.status
 *   + components.db.details. It does NOT return version, commitHash, or environment
 *   fields.
 * - DB detection is a substring-match heuristic: 'ORACLE' anywhere in the
 *   stringified response → Oracle ADB; otherwise Local H2. Acceptable for the
 *   current closed two-DB set; not a long-term contract.
 * - environment is DERIVED from DB flavor (Oracle → 'production'), not from a
 *   real environment signal.
 * - NO caching: each call is a separate fetch. isProduction() calls getSystemInfo()
 *   again — tracked under CB-APP19.
 */

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
    version: 'dev',
    environment: 'development',
    apiVersion: 'unknown',
    buildDate: 'unknown',
    uptime: '0h',
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
      console.warn(`Health endpoint returned status ${response.status}`);
      return fallback;
    }

    const data = (await response.json()) as SystemInfoResponse;

    const database = detectDatabase(data);

    const environment = database === 'Oracle ADB' ? 'production' : 'development';

    // BUCKET: /api/health does not return version/app-version/build-version — branch is dead; build-time version belongs in import.meta.env.VITE_* (CB-APP18 / CB-APP1)
    let version = 'dev';
    if (typeof data === 'object' && data !== null) {
      const versionFromResponse =
        (data as unknown as Record<string, unknown>).version ||
        (data as unknown as Record<string, unknown>)['app-version'] ||
        (data as unknown as Record<string, unknown>)['build-version'];

      if (typeof versionFromResponse === 'string') {
        version = versionFromResponse.startsWith('v') ? versionFromResponse : `v${versionFromResponse}`;
      }
    }

    // BUCKET: fabricated values — apiVersion hardcoded, buildDate is today-at-call-time, uptime is placeholder; remove or wire real sources (CB-APP18)
    return {
      database,
      version,
      environment,
      apiVersion: 'v1',
      buildDate: new Date().toISOString().split('T')[0],
      uptime: '0h',
      status: data.status || 'UP',
    };
  } catch (error) {
    console.error('Failed to fetch system info from health endpoint:', error);
    return fallback;
  }
};

export const isProduction = async (): Promise<boolean> => {
  // BUCKET: independent getSystemInfo() call — no shared cache (CB-APP19)
  const info = await getSystemInfo();
  return info.environment === 'production';
};

export const formatUptime = (uptimeSeconds: number): string => {
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};
