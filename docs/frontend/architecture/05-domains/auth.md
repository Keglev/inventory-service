# §5.5 Auth Domain

Public entry/exit pages under `frontend/src/pages/auth/` plus the auth-owned
global state in `context/auth/`.

## Login & Demo Entry

`LoginPage` is SSO-first: the Google button calls `useAuth().login()`, a
full-page redirect (not XHR) to
`<API origin>/oauth2/authorization/google?return=<origin>`. A `?error=` query
renders an error banner: `?error=unauthorized` shows a distinct "not authorized"
message (the Google account is not on the access allow-list), while other values
show a generic sign-in-failed message.
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
`allowDemo`. The authenticated shell runs `useSessionTimeout` as a heartbeat:
it pings `/api/me` on opening and on returning to the tab, then once a minute
only if the user did something since the last ping. An unattended tab sends
nothing, so the backend's session timeout (Spring Boot default, 30 minutes) is
the single idle limit for all tabs; the first ping after the user returns gets
the 401 and routes to logout. The 15-minute health poll sends no cookie, so it
cannot keep a session alive.

## Logout

Logout is a full navigation, not XHR: `LogoutPage` clears the React Query cache
(`queryClient.clear()`) and client auth state, then submits a top-level form POST
to `<API origin>/logout?return=<origin>/logout-success`, guaranteeing server-side
session invalidation; `LogoutSuccess` confirms.
