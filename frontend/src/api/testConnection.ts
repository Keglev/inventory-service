/**
 * @file testConnection.ts
 * @description
 * Health checks for connectivity and session validity.
 * - `testConnection()` -> hits a cheap health endpoint; returns boolean.
 * - `checkSession()` -> fetches `/api/me`; returns user profile or null on 401.
 *
 * @remarks
 * - Keeps API calls separate from React components and hooks.
 * - Centralizes error handling for connectivity/session checks.
 */
import httpClient from './httpClient';

export type AppUserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

/**
 * Calls a cheap health endpoint to confirm **backend + DB** connectivity.
 * Returns true on HTTP 200; otherwise false.
 *
 * @remarks
 * - Uses your existing `/health/db` path.
 * - If you later expose `/actuator/health` you can add a fallback branch.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const res = await httpClient.get('/health/db');
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Checks if a session is currently valid by fetching `/api/me`.
 * Returns the user profile on success, or `null` when not authenticated.
 */
export async function checkSession(): Promise<AppUserProfile | null> {
  try {
    const res = await httpClient.get<AppUserProfile>('/api/me');
    return res.data;
  } catch {
    return null;
  }
}


