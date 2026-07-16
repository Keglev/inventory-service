# ADR-0011: Restrict OAuth2 login to an email allow-list

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-07-16

## Context
Authentication is Google OAuth2/OIDC. The user services provisioned a local
`AppUser` for every successfully authenticated identity (find-or-create in
`UserProvisioningService`), and the admin allow-list (`APP_ADMIN_EMAILS`) only
decided the assigned role — not who may sign in.

The practical effect: any Google account that completed the consent screen was
provisioned as a `USER` and gained access to the live application and its data.
On a portfolio deployment intended for recruiters — who are expected to use the
read-only demo — this is an unintended open door: a technical reviewer signing
in with their own Google account would be admitted.

Forces:
- The demo path must stay open and frictionless (the recruiter entry point).
- Real sign-in must be limited to the owner without standing up a separate
  identity store or user-management UI.
- An unauthorized attempt must fail professionally — a branded, localized
  message, not a raw provider error — and must not create a local account.

## Decision
Gate OAuth2/OIDC sign-in on an allow-list, evaluated before any provisioning.
The gate reuses the existing `APP_ADMIN_EMAILS` list via an `isAllowedEmail`
seam on both user services; an email that is not allow-listed is rejected with
an `access_denied` `OAuth2AuthenticationException` and no `AppUser` is created.
The OAuth2 failure handler maps `access_denied` to a distinct frontend redirect
(`/login?error=unauthorized`), which renders a localized "not authorized"
message (EN/DE). The demo path is unaffected — it never reaches the user
services.

Access is intentionally equated with the admin list for now (single owner). The
`isAllowedEmail` seam is kept separate from role assignment so a broader access
list (for example a non-admin reviewer tier) can be added later without touching
the login flow.

## Alternatives Considered
- **Leave login open, rely on the read-only demo for recruiters.** Rejected: any
  Google user still gets a real, writable account against live data.
- **Introduce a dedicated `APP_ALLOWED_EMAILS` variable now.** Deferred: a second
  secret with no current consumer; the admin list already names the only
  permitted identity, and the seam makes this a one-line change later.
- **Restrict only at the Google consent screen (Testing mode / test users).**
  Kept as a complementary layer, but it cannot present a branded rejection — the
  user sees a generic Google error — and does not protect a Production app.

## Consequences
- Only allow-listed identities can sign in; unauthorized attempts get a clear,
  localized message and create no account. The demo remains the recruiter path.
- The gate is fail-closed: if `APP_ADMIN_EMAILS` is empty, no one can sign in via
  Google. The owner's email must remain on the list.
- `USER`-role provisioning via Google is unreachable while access equals the
  admin list; the provisioning and role-healing logic is retained for the future
  broader-access case and stays covered by tests.

## Implementation Notes
- Gate: `CustomOidcUserService` / `CustomOAuth2UserService` (`isAllowedEmail`,
  `access_denied` thrown before `provision`).
- Failure routing: `OAuth2Config.oauthFailureHandler` (`?error=unauthorized`).
- UI: `LoginPage` renders `auth:errorUnauthorized` (EN/DE).

## References
- [ADR-0007: Cross-origin session cookie configuration](adr-0007-cross-origin-auth-cookie.md)
- Section 8 Concepts — authentication flow (`../08-concepts.md`)
- Section 6 Runtime — login scenario (`../06-runtime.md`)
