<a id="top"></a>

[⬅️ Back to Auth Domain](./index.md)

- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)

# Login & Demo Entry

The login screen is intentionally SSO-first and avoids local credentials UX.

## Where it lives

- Page: `frontend/src/pages/auth/LoginPage.tsx`
- Auth actions: `frontend/src/context/auth/AuthContext.ts` via `useAuth()`

## Google OAuth entry

The “Sign in with Google” button calls:

- `useAuth().login()`

`login()` performs a full-page redirect:

- `window.location.assign(`${API_BASE}/oauth2/authorization/google?return=${origin}`)`

Notes:
- This is **not** an XHR call.
- The `return` query parameter tells the backend where to send the browser back after OAuth completes.

## Error banner

If `?error=` is present in the URL, the page shows an error `Alert`. This is used for cases like:
- user canceled OAuth consent
- callback failed to verify the session

## Demo entry

The “Continue in Demo Mode” action:
- calls `useAuth().loginAsDemo()`
- navigates to `/dashboard` with `replace: true`

The demo user is persisted under `localStorage['ssp.demo.session']`.

## i18n contract

Login uses the `auth` namespace keys such as:
- `signIn`, `welcome`, `signInGoogle`, `or`, `continueDemo`, `ssoHint`, `errorTitle`

---

[Back to top](#top)
