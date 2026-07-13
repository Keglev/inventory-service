<a id="top"></a>

[⬅️ Back to Data Access Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Connectivity & Session Probes

The frontend has a small “probe” module (`src/api/testConnection.ts`) used for cheap health and session validity checks.

## Backend/DB connectivity check

`testConnection()` calls a low-cost health endpoint (`/api/health/db`) and returns a boolean:
- `true` on HTTP 200
- `false` on any error

This is suitable for “is the system up?” UI checks without exposing detailed errors.

## Session validity check

`checkSession()` calls `/api/me` and returns:
- the user profile on success
- `null` when unauthenticated or the request fails

Important boundary:
- `/api/me` is treated as a **probe** endpoint and should not trigger global redirects (the HTTP client explicitly exempts it).

---

[Back to top](#top)
