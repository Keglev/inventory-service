/**
 * @module src/api/httpClient
 *
 * Singleton Axios instance used by every feature-level API module.  All
 * session-cookie authentication, shared request headers, and cross-cutting
 * 401 handling are wired here so individual feature modules stay focused on
 * their own resources.
 *
 * Base-URL contract: `VITE_API_BASE` is origin-only — no `/api` suffix;
 * call sites append `/api` on each request path themselves.  The origin is
 * resolved once, by api/apiBase, for every reader (this client, the login
 * redirect, the logout forms, the health probe), so an unset or '/' value
 * means same-origin everywhere instead of a different fallback per reader.
 *
 * Production guidance: deploy behind Nginx so frontend and backend share
 * the same origin; this keeps session cookies first-party and avoids CORS.
 *
 * Keep this file thin; feature APIs live under `src/features/**\/api.ts`.
 * Do not import from outside `src/api/` to avoid circular deps.
 * See https://axios-http.com/docs/interceptors for interceptor reference.
 */
import axios, { AxiosError } from 'axios';

import { readDemoSession } from '../context/auth/demoSession';
import { apiOrigin } from './apiBase';

const httpClient = axios.create({
  baseURL: apiOrigin(),
  withCredentials: true,
  timeout: 30_000,
});

// Set via `defaults` rather than `create` config to sidestep Axios v1 header-typing friction.
httpClient.defaults.headers.common['Accept'] = 'application/json';
httpClient.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

/**
 * Redirects unauthenticated requests to `/login`.
 *
 * Suppressed when the user is already on a public page (to prevent
 * redirect loops), when the failing call is the `/me` session probe
 * (a 401 is the expected "not logged in" signal there), or when a
 * demo session is active.
 *
 * Every error still rejects, a redirected 401 included.
 */
httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const resp = error?.response;
    if (!resp) return Promise.reject(error);

    if (resp.status === 401) {
      // A demo has no server session: its 401s are expected, not a logout.
      if (readDemoSession()) return Promise.reject(error);

      const path = window.location.pathname;
      const onPublic =
        path === '/' ||
        path.startsWith('/login') ||
        path.startsWith('/auth') ||
        path.startsWith('/logout');

      const reqUrl = typeof resp.config?.url === 'string' ? resp.config.url : '';
      const isMeProbe =
        reqUrl.includes('/api/me') || reqUrl === '/me' || reqUrl.startsWith('/me/');

      if (onPublic || isMeProbe) return Promise.reject(error);

      // The navigation is not immediate: resolving here would let a write
      // report success for a request the server refused.
      window.location.assign('/login');
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default httpClient;
