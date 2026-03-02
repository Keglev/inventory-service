[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Home Domain

This domain covers the public landing page for the root route (`/`) implemented under `frontend/src/pages/home`.

## 1️⃣ Domain Purpose

The Home domain is a thin entry hub that:
- redirects authenticated users straight into the app (`/dashboard`)
- gives unauthenticated users two clear paths:
  - **Sign in** → `/login`
  - **Continue in Demo Mode** → starts a client-only demo session and continues into the app

It intentionally keeps the unauthenticated UI minimal and avoids any direct backend calls.

## 2️⃣ Scope & Boundaries

Included:
- `Home.tsx` (root landing page orchestrator)
- Redirect behavior based on auth state (`useAuth(): { user, loading }`)
- Demo entry via `useAuth().loginAsDemo()`
- Public-route placement (outside `AppShell`)

Excluded:
- Login UI + OAuth redirect: see [Auth domain](../auth/index.md)
- Auth state and hydration rules: see [Auth Context](../../state/auth-context.md)
- Routing topology: see [Routing](../../routing/index.md)
- App chrome (AppBar/Drawer/Main): see [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  Route["/" route] --> Home[Home.tsx]

  Home -->|loading=true| Spinner[Centered spinner]

  Home -->|user != null| DashNav[<Navigate replace to "/dashboard">]

  Home -->|user == null| Card[Landing card]
  Card --> SignIn[Button: navigate("/login")]
  Card --> Demo[Button: loginAsDemo(); navigate("/dashboard", replace)]

  SignIn --> Login[/login]
  Demo --> Dashboard[/dashboard]
```

## 4️⃣ Domain Notes (Implementation-facing)

- `Home` is a **pure UI router**:
  - no HTTP requests
  - no React Query usage
  - only depends on the `AuthContext` state and actions

- Auth bootstrap is respected:
  - while `loading=true`, `Home` renders a spinner to avoid flicker/incorrect redirects.

- Demo entry behavior:
  - `loginAsDemo()` persists a demo user in `localStorage` so deep-links and refreshes remain usable.
  - After starting demo, the app route entry is the same as real users: `/dashboard`.

## 5️⃣ Domain Map (Planned deep-dives)

These pages are intentionally not written yet; they will be added as leaf docs next:

- Home copy/i18n contract (which `auth` keys are relied on)
- Why the landing page stays outside `AppShell`

---

[⬅️ Back to Domains Index](../index.md)
