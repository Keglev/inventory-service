/**
 * @module src/api/testConnection
 *
 * Lightweight probes for backend reachability and session validity.
 * Kept here rather than inside components so React code never makes raw
 * HTTP calls directly and error handling is centralised.
 *
 * Base-URL contract: `httpClient` carries an origin-only base (see
 * `httpClient.ts`); every path in this module therefore begins with `/api`.
 */
import httpClient from './httpClient';

/**
 * Shape of the authenticated-user payload returned by `/api/me`.
 * Typed here so `checkSession` callers can read identity without a
 * separate fetch.
 */
export type AppUserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

/**
 * Confirms backend and database reachability without touching application
 * state.  Returns `true` only on HTTP 200; any error (network, 5xx, etc.)
 * returns `false` so callers can surface a connectivity warning safely.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const res = await httpClient.get('/api/health/db');
    return res.status === 200;
  } catch {
    return false;
  }
}

/**
 * Determines whether a server-side session exists by probing `/api/me`.
 * Returns the user profile when authenticated, or `null` on any failure.
 * The response interceptor in `httpClient` does not redirect on `/me`
 * probes, so 401s surface here as a caught error rather than a navigation.
 */
export async function checkSession(): Promise<AppUserProfile | null> {
  try {
    const res = await httpClient.get<AppUserProfile>('/api/me');
    return res.data;
  } catch {
    return null;
  }
}
