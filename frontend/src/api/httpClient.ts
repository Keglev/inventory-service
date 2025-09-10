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
import axios, { AxiosError } from 'axios';

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

// ---- Response interceptor: centralize 401 handling ----
httpClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    // Let route guards (RequireAuth) and feature code decide what to do.
    return Promise.reject(error);
  }
);

export default httpClient;
