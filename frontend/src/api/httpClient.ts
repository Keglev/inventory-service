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
 * - Keep this file thin; feature-specific APIs should live under src/features/**api.ts.
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
 * - Production should call the backend **same-origin** through Nginx,
 *   which proxies `/api` to the Spring service. That keeps cookies first-party.
 * - Treat undefined, empty, or whitespace-only envs as "not set" and fall back to `/api`.
 */
const RAW_BASE = (import.meta.env as unknown as ViteEnv)?.VITE_API_BASE;
export const API_BASE: string = (() => {
  const v = (RAW_BASE ?? '').trim();
  return v.length > 0 ? v : '/api';
})();

/* Create the HTTP client */
const httpClient = axios.create({
  baseURL: API_BASE.replace(/\/+$/, ''), // normalize trailing slash
  withCredentials: true,
  timeout: 30_000,
});

/** Common headers (set via defaults to avoid Axios v1 typing friction). */
httpClient.defaults.headers.common['Accept'] = 'application/json';
httpClient.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Tolerate old calls like httpClient.get('/api/xyz') by stripping the extra '/api'
 * when baseURL already is '/api'.
 *
 * @enterprise
 * - Lets you migrate call sites gradually.
 */
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  //const u = typeof config.url === 'string' ? config.url : '';
  // Only strip if baseURL is *exactly* '/api'
  //const base = (httpClient.defaults.baseURL || '').replace(/\/+$/, '');
  //if (base === '/api' && u.startsWith('/api/')) {
  //  config.url = u.slice(4); // '/api/foo' -> '/foo'
  //}
  return config;
});

/** Detect if we are in a demo session (no redirect on 401). */
function isDemoSession(): boolean {
  try {
    const raw = localStorage.getItem('ssp.demo.session');
    return !!raw && JSON.parse(raw)?.isDemo === true;
  } catch {
    return false;
  }
}

/** 401 → /login (but never from public pages or the /me probe). */
httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const resp = error?.response;
    if (!resp) return Promise.reject(error);

    if (resp.status === 401) {
      if (isDemoSession()) return Promise.reject(error);

      // Never redirect if already on a public page or if this is the /me probe
      const path = window.location.pathname;
      const onPublic =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/auth') ||
        path.startsWith('/logout');

      // Check if this is the /me probe (can be on any page)
      const reqUrl = typeof resp.config?.url === 'string' ? resp.config.url : '';
      const isMeProbe =
        reqUrl.includes('/api/me') || reqUrl === '/me' || reqUrl.startsWith('/me/');

      if (onPublic || isMeProbe) return Promise.reject(error);

      // Redirect to login
      console.debug('[401]', resp.config?.method?.toUpperCase(), resp.config?.url);
      window.location.assign('/login');
      return;
    }
    return Promise.reject(error);
  }
);

export default httpClient;
