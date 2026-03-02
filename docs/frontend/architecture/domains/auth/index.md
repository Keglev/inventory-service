[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Auth Domain

This domain covers the public authentication pages under `frontend/src/pages/auth` and how they integrate with the global auth state and route guards.

## 1️⃣ Domain Purpose

The Auth domain provides a minimal, predictable entry/exit experience:
- Start Google OAuth2 login (full-page redirect via backend).
- Handle the OAuth callback and hydrate the SPA user session.
- Support a client-only Demo Mode for read-only exploration.
- Perform logout in a way that reliably invalidates the server session.

## 2️⃣ Scope & Boundaries

Included:
- `LoginPage.tsx` (SSO entry + Demo Mode entry)
- `AuthCallback.tsx` (session verification via `/api/me`)
- `LogoutPage.tsx` (client cleanup + backend logout via POST form)
- `LogoutSuccess.tsx` (confirmation screen)

Related (cross-cutting, but auth-owned behavior):
- `AuthContext` session hydration + demo persistence (`frontend/src/context/auth/AuthContext.ts`)
- Route guarding (`RequireAuth`) and route placement in the router
- Proactive session checking (`useSessionTimeout`) in the authenticated shell

Excluded:
- Global route definitions and shell layout: see [Routing](../../routing/index.md) and [App Shell](../../app-shell/index.md)
- HTTP client/auth redirect rules: see [Data Access](../../data-access/index.md)
- Auth state API and constraints: see [Auth Context](../../state/auth-context.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  subgraph Public[Public routes - outside AppShell]
    Login[LoginPage.tsx
/login] -->|Google SSO| OAuthRedirect[useAuth().login()
window.location.assign]
    Login -->|Demo Mode| Demo[useAuth().loginAsDemo()
persist localStorage]

    Callback[AuthCallback.tsx
/auth] --> Verify[GET /api/me
(httpClient)]
    Verify -->|200 OK| Hydrate[useAuth().setUser(...)]
    Verify -->|error| LoginErr[/login?error=session/]

    LogoutOK[LogoutSuccess.tsx
/logout-success]
  end

  OAuthRedirect --> BackendOAuth[Backend: /oauth2/authorization/google
?return=<origin>]
  BackendOAuth --> Callback
  Hydrate --> Dashboard[/dashboard]

  subgraph Guard[Protected routes - inside AppShell]
    Require[RequireAuth
(redirects to /login when unauth)]
    Shell[AppShell
uses useSessionTimeout]
    AppRoutes[Dashboard / Inventory / Suppliers / Analytics]
  end

  Dashboard --> Shell
  Shell --> AppRoutes
  Require --> AppRoutes

  subgraph Logout[Logout flow]
    LogoutRoute[/logout] --> LogoutPage[LogoutPage.tsx]
    LogoutPage --> Clear[queryClient.clear()
useAuth().logout()]
    LogoutPage --> Post[POST form: API_BASE/logout
?return=<origin>/logout-success]
    Post --> LogoutOK
  end

  Shell -->|heartbeat 401/403| LogoutRoute
```

## 4️⃣ Domain Notes (Implementation-facing)

- Auth is implemented as **public pages** plus **global state**:
  - Pages under `src/pages/auth/*` are intentionally minimal and don’t own global routing.
  - `AuthContext` is the single source of truth for `user`, `loading`, and `logoutInProgress`.

- **Session hydration order** (in `AuthContext`):
  1) Restore Demo user from `localStorage` (key `ssp.demo.session`) if present.
  2) Otherwise call `GET /api/me` to hydrate a real user session.

- **OAuth2 entry** is a full-page redirect (`window.location.assign`):
  - `useAuth().login()` builds a backend URL like `${API_BASE}/oauth2/authorization/google?return=<origin>`.
  - The SPA expects to land back on `/auth` after backend auth completes.

- **Logout is also a full navigation** using a top-level form POST:
  - Avoids XHR/CORS and ensures server-side session invalidation.
  - Cleanup responsibilities are centralized in `LogoutPage`:
    - React Query cache cleared via `queryClient.clear()`.
    - Client auth state cleared via `useAuth().logout()`.

- **Guard semantics** (`RequireAuth`):
  - While auth is bootstrapping (`loading=true`) it renders a fallback instead of routing.
  - `logoutInProgress` acts like a temporary “loading” state to prevent flashing `/login` during teardown.
  - Demo users are treated as authenticated, but routes can opt out by omitting `allowDemo`.

## 5️⃣ Domain Map (Planned deep-dives)

These pages are intentionally not written yet; they will be added as leaf docs next:

- OAuth return URL contract: backend expectations and frontend invariants
- Demo mode boundaries: what is allowed/blocked and where enforcement happens
- Logout hardening: CSRF considerations and future-proofing the POST flow

---

[⬅️ Back to Domains Index](../index.md)
