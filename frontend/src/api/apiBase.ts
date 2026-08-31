/**
 * @file apiBase.ts
 * @module api/apiBase
 * @summary Builds request URLs from the configured API origin for the few
 *   callers that deliberately bypass httpClient.
 *
 * @enterprise
 * - Two consumers, both raw-fetch health probes that stay outside httpClient
 *   on purpose (features/health/hooks/useHealthCheck.ts, utils/systemInfo.ts).
 *   A relative path in those probes follows the SERVING origin, not the API
 *   origin: under `vite preview` the static server answers them, and behind
 *   the dev proxy the production backend did.
 * - httpClient's exported API_BASE is deliberately not reused. Its fallback
 *   for a blank env value is '/api', an axios baseURL rather than an origin,
 *   so `${API_BASE}/api/health` would resolve to '/api/api/health' whenever
 *   VITE_API_BASE is unset (test runs, builds without an env file).
 * - VITE_API_BASE is origin-only by contract (no '/api' suffix); call sites
 *   pass the full path. An unset or '/' value yields '', which keeps
 *   same-origin development and the Vite dev proxy working unchanged.
 * - Read at call time rather than at module scope so tests can stub the
 *   environment without resetting module state.
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
