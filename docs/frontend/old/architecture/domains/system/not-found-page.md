<a id="top"></a>

[⬅️ Back to System Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Not Found Page (404)

The System domain currently consists primarily of the global 404 fallback page.

## Where it lives

- Page: `frontend/src/pages/system/NotFoundPage.tsx`
- Auth state: `useAuth()` (to decide which next-step action to offer)

## Behavior

- Renders a neutral “Not found” title and body (i18n).
- Renders a single primary action button:
  - if authenticated → label `common:nav.dashboard`, navigate to `/dashboard`
  - if unauthenticated → label `auth:signIn`, navigate to `/login`

No data fetching, no side effects.

## i18n contract

NotFound uses multiple namespaces:
- `system`: `notFound.title`, `notFound.body`
- `common`: `nav.dashboard`
- `auth`: `signIn`

## Conceptual flow

```mermaid
flowchart TD
  Unknown[Unknown route] --> NotFound[NotFoundPage]
  NotFound --> Auth{user?}
  Auth -->|yes| Dash[/dashboard]
  Auth -->|no| Login[/login]
```

---

[Back to top](#top)
