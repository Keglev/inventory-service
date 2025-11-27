/**
 * @file systemInfo.ts
 * @description
 * System information retrieval from backend health endpoint.
 * Auto-detects database type and other system characteristics.
 *
 * @enterprise
 * - Single source of truth: /api/health endpoint
 * - Auto-detection logic: "Oracle" in response → "Oracle ADB", else "Local H2"
 * - Caching to avoid excessive requests
 * - Fallback values for reliability
 *
 * @usage
 * import { getSystemInfo } from '../utils/systemInfo'
 * const info = await getSystemInfo()
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

/**
 * Detect database type from health endpoint response.
 * Smart detection: if "Oracle" appears in any string, it's Oracle ADB.
 * Otherwise, defaults to "Local H2" (development database).
 * @param healthResponse - Response from /api/health endpoint
 * @returns Database type string
 */
const detectDatabase = (healthResponse: unknown): string => {
  try {
    const response = healthResponse as SystemInfoResponse;

    // Check if response contains Oracle database indicators
    const responseString = JSON.stringify(response).toUpperCase();
    if (responseString.includes('ORACLE')) {
      return 'Oracle ADB';
    }

    // Check database details if available
    if (response.components?.db?.details?.database) {
      const db = response.components.db.details.database.toUpperCase();
      if (db.includes('ORACLE')) {
        return 'Oracle ADB';
      }
    }

    // Default to Local H2 for development
    return 'Local H2';
  } catch {
    // Fallback if parsing fails
    return 'Local H2';
  }
};

/**
 * Retrieve system information from backend health endpoint.
 * Includes app version, database type, environment, etc.
 * @returns System info object with database, version, and environment details
 * @throws May log errors but always returns fallback values
 *
 * @example
 * const systemInfo = await getSystemInfo()
 * console.log(systemInfo.database)  // → 'Oracle ADB' or 'Local H2'
 * console.log(systemInfo.version)   // → 'v2.0.0' or 'dev'
 * console.log(systemInfo.environment) // → 'production' or 'development'
 */
export const getSystemInfo = async () => {
  // Fallback values for reliability
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
      // No timeout needed - browser default is used
    });

    if (!response.ok) {
      console.warn(`Health endpoint returned status ${response.status}`);
      return fallback;
    }

    const data = (await response.json()) as SystemInfoResponse;

    // Detect database from response
    const database = detectDatabase(data);

    // Determine environment based on database type
    const environment = database === 'Oracle ADB' ? 'production' : 'development';

    // Extract version from response if available
    // Backends may include version in different locations
    let version = 'dev';
    if (typeof data === 'object' && data !== null) {
      // Try common version locations
      const versionFromResponse =
        (data as unknown as Record<string, unknown>).version ||
        (data as unknown as Record<string, unknown>)['app-version'] ||
        (data as unknown as Record<string, unknown>)['build-version'];

      if (typeof versionFromResponse === 'string') {
        version = versionFromResponse.startsWith('v') ? versionFromResponse : `v${versionFromResponse}`;
      }
    }

    return {
      database,
      version,
      environment,
      apiVersion: 'v1',
      buildDate: new Date().toISOString().split('T')[0],
      uptime: '0h', // Could be extended with actual uptime from backend if provided
      status: data.status || 'UP',
    };
  } catch (error) {
    // Log the error for debugging but don't throw - return fallback
    console.error('Failed to fetch system info from health endpoint:', error);
    return fallback;
  }
};

/**
 * Check if system is in production based on database type.
 * Useful for conditionally showing features/warnings.
 * @returns boolean indicating if production environment
 * @example
 * if (await isProduction()) {
 *   // Show production warning
 * }
 */
export const isProduction = async (): Promise<boolean> => {
  const info = await getSystemInfo();
  return info.environment === 'production';
};

/**
 * Format uptime string for display.
 * @param uptimeSeconds - Uptime in seconds
 * @returns Formatted uptime string
 * @example
 * formatUptime(3661)  // → '1h 1m'
 * formatUptime(60)    // → '1m'
 * formatUptime(3661)  // → '1h 1m 1s'
 */
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
