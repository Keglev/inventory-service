<a id="top"></a>

[⬅️ Back to Home Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Home and AppShell Placement

Home is designed to be reachable as a **public** route and to remain minimal.

## Intent

- Keep the root landing page fast and predictable.
- Avoid any dependency on authenticated-only UI chrome.
- Avoid triggering data queries before the user is authenticated (or in demo mode).

## Practical implications

- Home uses only:
  - `useAuth()` for `{ user, loading, loginAsDemo }`
  - `react-router` navigation/redirects
  - a small MUI card layout

- Home does **not**:
  - use React Query
  - call backend APIs
  - assume AppShell layout (AppBar/Sidebar)

This separation reduces flicker and prevents early requests that would immediately redirect on 401.

## Related behavior

- If the user chooses Demo Mode, the app transitions to normal in-app navigation by routing to `/dashboard`.
- If the user signs in, the Auth domain handles OAuth and hydration, then also routes to `/dashboard`.

---

[Back to top](#top)
