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

const BACKEND_URL = import.meta.env.VITE_API_BASE; // MUST be set

if (!BACKEND_URL) {
  // Hard-fail loudly so this never silently falls back to window.origin
  // You can remove this once your env is solid.
  throw new Error("VITE_API_BASE is not defined");
}

const httpClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json', // Ensure /api returns JSON (not HTML) on 401
  },
});

export default httpClient;

