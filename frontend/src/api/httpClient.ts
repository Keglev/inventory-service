/**
 * @file httpClient.ts
 * @description
 * - Base URL from VITE_API_BASE (fallback keeps the current default)
 * - withCredentials: true for session cookies
 * - JSON Accept header for session-cookie-authenticated APIs
 * - Response interceptor: on 401 -> navigate to /logout (centralized cleanup)
 *
 * @enterprise
 * - Keep this file thin; feature-specific APIs should live under src/features/ ** /api.ts.
 * - If later want to retries/backoff, add them here so all consumers benefit
 * - Avoid circular dependencies by not importing from outside src/api/
 * - See https://axios-http.com/docs/interceptors for more on interceptors
 */
import axios from 'axios';

/**
 * API base URL.
 * - Preferred: set `VITE_API_BASE` in your env (e.g., https://inventoryservice.fly.dev).
 * - Fallback: your current production URL (kept for compatibility).
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim()) ||
  'https://inventoryservice.fly.dev';

const httpClient = axios.create({
  baseURL: API_BASE.replace(/\/+$/, ''), // normalize trailing slash
  withCredentials: true,                 // send/receive session cookies
  headers: {
    Accept: 'application/json',          // encourage JSON for errors (401)
    'X-Requested-With': 'XMLHttpRequest' // some backends treat this as AJAX
  },
  timeout: 30_000,                       // sane client timeout
});

// Safe 401 handling: do NOT force redirects on public routes or /api/me
httpClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const resp = error?.response;
    if (!resp) return Promise.reject(error);

    if (resp.status === 401) {
      // Current SPA route (not the request URL)
      const path = window.location.pathname;

      // Public routes (let the page render; don't bounce)
      const onPublic =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/auth') ||
        path.startsWith('/logout');

      // Probe endpoint: a 401 is expected when not logged in
      const isMeProbe =
        typeof resp.config?.url === 'string' && resp.config.url.includes('/api/me');

      if (onPublic || isMeProbe) {
        return Promise.reject(error); // just surface the 401 to caller
      }

      if (error?.response?.status === 401) {
      console.debug('[401]', error?.config?.url);
      }

      // Otherwise, user tried to hit a protected API while not authenticated → go to login
      window.location.assign('/login');
      return; // stop promise chain
    }

    return Promise.reject(error);
  }
);


export default httpClient;
