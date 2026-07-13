<a id="top"></a>

[⬅️ Back to Auth Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Logout Flow (POST form)

Logout is designed to reliably invalidate the server session without XHR/CORS issues.

## Where it lives

- Logout page: `frontend/src/pages/auth/LogoutPage.tsx`
- Success screen: `frontend/src/pages/auth/LogoutSuccess.tsx`
- Auth state cleanup: `frontend/src/context/auth/AuthContext.ts` (`logout()`)

## Why a form POST

The logout route performs a full navigation using a top-level HTML form:

- `POST ${API_BASE}/logout?return=<origin>/logout-success`

This avoids:
- XHR redirects
- browser CORS restrictions around credentialed requests

## Client-side cleanup happens first

On mount, `LogoutPage`:

1) clears React Query cache via `queryClient.clear()`
2) clears AuthContext user state via `useAuth().logout()`
   - also clears demo persistence (`ssp.demo.session`)
   - sets `logoutInProgress` briefly to avoid UI flash

Then it submits the form to the backend.

## Success screen

`LogoutSuccess.tsx` is intentionally side-effect free:
- it only renders confirmation copy + a button back to `/login`.

## Conceptual flow

```mermaid
flowchart TD
  Route[/logout] --> Page[LogoutPage]
  Page --> Clear[Clear query cache + AuthContext.logout]
  Page --> Post[POST form to backend /logout]
  Post --> Done[/logout-success]
  Done --> Btn[Button -> /login]
```

---

[Back to top](#top)
