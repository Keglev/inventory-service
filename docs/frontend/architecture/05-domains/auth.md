# §5.5 Auth Domain

Public entry/exit pages under `frontend/src/pages/auth/` plus the auth-owned
global state in `context/auth/`.

## Login & Demo Entry

`LoginPage` is SSO-first: the Google button calls `useAuth().login()`, a
full-page redirect (not XHR) to
`${API_BASE}/oauth2/authorization/google?return=<origin>`. A `?error=` query
renders an error banner (canceled consent, failed session verification).
"Continue in Demo Mode" calls `useAuth().loginAsDemo()`, persists the demo user
under `localStorage['ssp.demo.session']`, and navigates to the dashboard — a
client-only, read-only session with no backend account.

## Callback & Session Hydration

The backend lands the browser on `/auth`; `AuthCallback` does one job — verify the
session via `GET /api/me` — then `setUser({email, fullName, role})` and navigate
to `/dashboard` (replace), or to `/login?error=session` on failure, with a
cancellation flag against post-unmount state updates. Independently,
`AuthProvider` runs one-time bootstrap hydration on app start: restore the demo
session from localStorage if present, otherwise attempt `/api/me` — covering
refresh, deep links, and reopening.

## Guarding & Session Timeout

`RequireAuth` renders a fallback while auth is bootstrapping, treats
`logoutInProgress` as a temporary loading state (no `/login` flash during
teardown), and treats demo users as authenticated unless a route omits
`allowDemo`. The authenticated shell runs `useSessionTimeout` as a heartbeat;
401/403 routes to logout.

## Logout

Logout is a full navigation, not XHR: `LogoutPage` clears the React Query cache
(`queryClient.clear()`) and client auth state, then submits a top-level form POST
to `${API_BASE}/logout?return=<origin>/logout-success`, guaranteeing server-side
session invalidation; `LogoutSuccess` confirms.
