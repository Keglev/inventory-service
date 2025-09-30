/**
 * @file httpClient.ts
 * @description
 * - Base URL from VITE_API_BASE with resilient fallback to **api** (same-origin).
 * - withCredentials: true so session cookies are sent on same-origin requests.
 * - JSON Accept header for session-cookie-authenticated APIs.
 * - Response interceptor: on 401 -> navigate to /login except on public routes
 *   and probe endpoints.
 *
 * @enterprise
 * - Keep this file thin; feature-specific APIs should live under src/features **api.ts.
 * - Centralize retries/backoff and cross-cutting concerns here so all consumers benefit.
 * - Avoid circular deps by not importing from outside src/api/.
 * - See https://axios-http.com/docs/interceptors for more on interceptors.
 */
import axios, { type InternalAxiosRequestConfig, AxiosError } from 'axios';

/** Narrow typing for Vite env to avoid `any`. */
interface ViteEnv {
  VITE_API_BASE?: string;
}

/**
 * API base URL resolution.
 *
 * @enterprise
 * - We want production to call the backend **same-origin** through Nginx,
 *   which proxies `/api` to the Spring service. That ensures cookies (SameSite, Secure)
 *   are first-party and actually flow, avoiding 401s seen with cross-site calls
 *   to `https://inventoryservice.fly.dev`.
 * - Treat undefined, empty, or whitespace-only envs as "not set" and fall back to `/api`.
 * - You can still point dev at a remote by setting VITE_API_BASE, but the recommended
 *   setup is: browser calls `/api` → Vite dev server proxy → remote.
 */
const RAW_BASE = (import.meta.env as unknown as ViteEnv)?.VITE_API_BASE;
export const API_BASE: string = (() => {
  const v = (RAW_BASE ?? '').trim();
  return v.length > 0 ? v : '/api';
})();

/* Create the HTTP client */
const httpClient = axios.create({
  // Normalize trailing slash so '/api' and '/api/' behave the same
  baseURL: API_BASE.replace(/\/+$/, ''),
  withCredentials: true, // send/receive session cookies
  timeout: 30_000,
});

/**
 * Set common headers on the instance defaults (avoids `headers` type narrowing issues
 * in axios.create with Axios v1).
 */
httpClient.defaults.headers.common['Accept'] = 'application/json';
httpClient.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Normalize request URLs so callers can use either:
 *   - httpClient.get('/foo')            // preferred (baseURL '/api' → '/api/foo')
 *   - httpClient.get('/api/foo')        // legacy style; we'll strip the extra '/api'
 *
 * @enterprise
 * - This keeps the codebase tolerant while you migrate calls away from absolute '/api/...'.
 */
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const u = typeof config.url === 'string' ? config.url : '';
  if (u.startsWith('/api/')) {
    // Strip only the FIRST '/api/' so '/api/foo' -> '/foo'
    config.url = u.replace(/^\/api\//, '/');
  }
  return config;
});

/**
 * Demo-session helper: avoid redirect loops when you intentionally run without auth.
 */
function isDemoSession(): boolean {
  try {
    const raw = localStorage.getItem('ssp.demo.session');
    return !!raw && JSON.parse(raw)?.isDemo === true;
  } catch {
    return false;
  }
}

/**
 * 401 handling
 * - Do not redirect away from public pages or when probing the "who am I" endpoint.
 * - Otherwise, send the user to /login so Spring Security can start OAuth again.
 */
httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const resp = error?.response;
    if (!resp) return Promise.reject(error);

    if (resp.status === 401) {
      if (isDemoSession()) return Promise.reject(error);

      const path = window.location.pathname;
      const onPublic =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/auth') ||
        path.startsWith('/logout');

      // Detect "who am I" probes whether the call used '/api/me...' or just '/me...'
      const reqUrl = typeof resp.config?.url === 'string' ? resp.config.url : '';
      const isMeProbe =
        reqUrl.includes('/api/me') || reqUrl === '/me' || reqUrl.startsWith('/me/');

      if (onPublic || isMeProbe) {
        return Promise.reject(error);
      }
      // Helpful breadcrumb in dev tools
      console.debug('[401]', resp.config?.method?.toUpperCase(), resp.config?.url);

      // Not authenticated and attempted a protected API → route to login
      window.location.assign('/login');
      return; // stop promise chain
    }

    return Promise.reject(error);
  }
);

export default httpClient;