<a id="top"></a>

[⬅️ Back to Data Access Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# HTTP Client & Auth Boundaries

All API calls go through a shared Axios instance in `src/api/httpClient.ts`.

## Base URL and deployment intent

- The client resolves its base URL from `VITE_API_BASE`.
- If the env var is missing/blank, it falls back to **same-origin** `/api`.
- Requests are sent with `withCredentials: true` so **session cookies** are included.

Practical implication:
- Keep API call sites consistent about whether they include the `/api/...` prefix in the request path.

## Cross-cutting headers

The client sets common defaults:
- `Accept: application/json`
- `X-Requested-With: XMLHttpRequest`

## 401 handling and navigation boundaries

A response interceptor handles `401 Unauthorized` centrally:
- If the frontend is on a public page (`/`, `/login`, `/auth*`, `/logout*`): do **not** redirect.
- If the request is a `/me` probe: do **not** redirect.
- If a demo session is active: do **not** redirect.
- Otherwise: navigate to `/login`.

This keeps “session expired → login” consistent across all feature areas, without duplicating redirect logic in every hook.

## What this file should not contain

- Feature-specific endpoints (they belong under `src/api/<domain>/*`)
- UI concerns like toasts/snackbars (surface errors up; UI decides how to display)

---

[Back to top](#top)
