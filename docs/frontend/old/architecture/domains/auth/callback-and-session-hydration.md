<a id="top"></a>

[⬅️ Back to Auth Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# OAuth Callback & Session Hydration

After the backend OAuth flow completes, the SPA verifies the session and hydrates the in-memory user.

## Where it lives

- Callback page: `frontend/src/pages/auth/AuthCallback.tsx`
- Global session hydration: `frontend/src/context/auth/AuthContext.ts`
- HTTP behavior and 401 redirect rules: `frontend/src/api/httpClient.ts`

## Callback responsibility

`AuthCallback.tsx` does one job on mount:
- call `GET /api/me`

On success:
- `setUser({ email, fullName, role })`
- `navigate('/dashboard', { replace: true })`

On failure:
- `navigate('/login?error=session', { replace: true })`

It includes a cancellation flag to avoid setting state after unmount.

## How it relates to AuthProvider hydration

Separately from the callback page, the `AuthProvider` runs one-time hydration on app start:

1) Restore demo session from `localStorage['ssp.demo.session']` if present.
2) Otherwise, attempt `GET /api/me` to hydrate a real session.

This means:
- The callback page is the *post-OAuth happy path*.
- The provider hydration is the *bootstrap path* (refresh, deep-link, reopening the app).

## Conceptual flow

```mermaid
flowchart TD
  BackendOAuth[Backend OAuth completes] --> Callback[/auth]
  Callback --> Me[GET /api/me]
  Me -->|200| SetUser[setUser(...) in AuthContext]
  Me -->|error| LoginErr[/login?error=session]
  SetUser --> Dash[/dashboard]
```

---

[Back to top](#top)
