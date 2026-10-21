/**
 * @file apiBase.ts
 * @module api/apiBase
 * @summary The single reader of VITE_API_BASE: resolves the API origin and
 *   builds absolute request URLs from it.
 *
 * @enterprise
 * - Readers: httpClient's axios baseURL, the login redirect (AuthContext),
 *   the logout form POSTs (LogoutPage, useShellLogout) and the raw-fetch
 *   health probe (useHealthCheck). Before FO1 the client and the redirects
 *   used their own resolver, which turned '/' into '//logout' (a host named
 *   "logout") and an unset value into '/api/api/...'.
 * - VITE_API_BASE is origin-only by contract (no '/api' suffix); call sites
 *   pass the full path. An unset or '/' value yields '', so every reader
 *   stays same-origin and the Vite dev proxy (/api, /oauth2, /logout)
 *   answers.
 * - Read at call time rather than at module scope so tests can stub the
 *   environment without resetting module state; httpClient reads it once,
 *   when its module loads.
 */

/** Narrows `import.meta.env` to the env var this module reads. */
interface ViteEnv {
  VITE_API_BASE?: string;
}

/** Configured API origin without a trailing slash; '' when unset or '/'. */
export function apiOrigin(): string {
  const raw = (import.meta.env as unknown as ViteEnv)?.VITE_API_BASE ?? '';
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Prefixes an absolute request path with the configured API origin.
 *
 * @param path request path starting with '/', e.g. '/api/health'
 * @returns an absolute URL when an origin is configured, else the path itself
 */
export function apiUrl(path: string): string {
  return `${apiOrigin()}${path}`;
}
