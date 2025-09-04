import axios from 'axios';

/**
 * Axios instance used for all API calls.
 *
 * - baseURL:
 *   - In development, we intentionally leave it empty to hit Vite's dev server
 *     and let the configured proxy forward `/api`, `/oauth2`, `/logout`, `/health`
 *     to the backend (same-origin at runtime, fewer CORS/cookie pitfalls).
 *   - In production, set VITE_API_BASE (e.g., https://inventoryservice.fly.dev).
 *
 * - withCredentials:
 *   Required for session-cookie authentication (JSESSIONID).
 *
 * - headers:
 *   For `/api/**` endpoints, we expect JSON 401 responses when unauthenticated.
 *   The default Accept header helps ensure consistent behavior.
 */

export const API_BASE =
  (import.meta.env.VITE_API_BASE && import.meta.env.VITE_API_BASE.trim()) ||
  "https://inventoryservice.fly.dev";

const httpClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    Accept: 'application/json'}, // Ensure /api returns JSON (not HTML) on 401
});

export default httpClient;

