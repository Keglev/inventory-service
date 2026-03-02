[⬅️ Back to Domains Index](../index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# System Domain

This domain covers “system-level” pages that exist outside business workflows, such as the global 404 fallback.

## 1️⃣ Domain Purpose

The System domain provides a safe, neutral UX for unexpected navigation states:
- When a user navigates to an unknown route, show a simple 404 page.
- Offer a clear next step:
  - authenticated users → go back to `/dashboard`
  - unauthenticated users → go to `/login`

## 2️⃣ Scope & Boundaries

Included:
- `NotFoundPage.tsx` (generic 404)
- Router fallback wiring (`Route path="*"`)
- “Next step” decision logic based on `useAuth().user`

Excluded:
- Public landing page behavior: see [Home domain](../home/index.md)
- Login/callback/logout flows: see [Auth domain](../auth/index.md)
- Global route structure and shells: see [Routing](../../routing/index.md) and [App Shell](../../app-shell/index.md)

## 3️⃣ High-Level Diagram

```mermaid
flowchart TD
  Unknown[Unknown URL] --> Router[AppRouter.tsx]
  Router --> Star[Route path="*"
(NotFoundPage)]

  Star --> Auth{useAuth().user?}
  Auth -->|yes| Dash[Button → /dashboard]
  Auth -->|no| Login[Button → /login]

  Star --> I18n[i18n copy
(system/common/auth namespaces)]
```

## 4️⃣ Domain Notes (Implementation-facing)

- The 404 page is intentionally **lightweight**:
  - no React Query usage
  - no HTTP calls
  - no shell dependencies (it’s reachable as a public fallback)

- Copy is internationalized via `react-i18next`:
  - uses the `system` namespace for title/body
  - uses `common` and `auth` for button labels (dashboard vs sign-in)

- The “next step” button uses a single decision:
  - if `user` exists, route to `/dashboard`
  - otherwise route to `/login`

## 5️⃣ Domain Map (Planned deep-dives)

These pages are intentionally not written yet; they will be added as leaf docs next (if/when the domain grows):

- Global error page / error boundary policy
- Maintenance / degraded-mode screen (if introduced)
- Correlation ID / diagnostics patterns for error surfaces

---

[⬅️ Back to Domains Index](../index.md)
