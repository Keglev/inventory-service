# ADR-0008: Serve-time API-base rewrite and same-origin proxy

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted — documented retroactively on 2026-07-13; the mechanism predates this record
and was previously described only in `ops/nginx/default.conf` comments.

## Context
The production build bakes an absolute backend origin into the JavaScript bundle
(`VITE_API_BASE=https://inventoryservice.fly.dev` in `frontend/.env.production`), and
the login flow navigates to the same absolute origin. The original deployment design
ran this as a direct cross-origin topology — SPA on Koyeb calling Fly.io — carried by
a `SameSite=None; Secure` cookie and a CORS allow-list
([ADR-0007](adr-0007-cross-origin-auth-cookie.md)).

Cross-site cookies are an increasingly fragile foundation: browsers restrict
third-party cookies progressively, and every authenticated call depends on the
`SameSite=None` exemption surviving browser policy changes.

## Decision
Koyeb's Nginx makes production browser traffic **same-origin** without changing the
build:

- `sub_filter` rewrites the baked backend origin to the frontend host as the bundle
  is served (`sub_filter_types application/javascript text/html; sub_filter_once off`),
  so the browser-visible API base becomes the Koyeb origin.
- Reverse-proxy locations for `/api/`, `/oauth2/authorization/`, `/login/oauth2/`, and
  `/logout` forward to the Fly.io backend server-side.
- `proxy_cookie_domain` re-domains the backend's `Set-Cookie` to the frontend host, so
  the session cookie is first-party in the browser.

Verified empirically (2026-07-13): a local production build places the Fly.io origin
in the entry bundle; the deployed entry bundle served from Koyeb does not contain it —
the rewrite is active and load-bearing.

## Consequences
- Browser traffic is same-origin; the session cookie is first-party and independent of
  third-party-cookie policy changes.
- `SameSite=None` and the CORS allow-list remain configured on the backend. They are
  not required by the proxied path itself; they keep the **direct** Fly.io-origin path
  functional (diagnostics, API tooling, and resilience if the rewrite ever fails).
- **Known fragility**: `sub_filter` only rewrites responses whose MIME type is listed
  in `sub_filter_types`. Nginx's bundled `mime.types` maps `.js` to
  `application/javascript` in older releases and `text/javascript` in newer ones — a
  base-image bump could silently stop the rewrite, flipping production back to the
  direct cross-origin path. That path still works (previous point), but the flip would
  be invisible without a check; verifying the served bundle for the backend origin is
  the cheap detection.

## Alternatives considered
- **Relative API base** (empty `VITE_API_BASE`): same-origin natively, no rewrite
  needed; requires the OAuth2 redirect targets and any absolute-URL assumptions to be
  revisited. Cleaner long-term; the rewrite achieves the same result without touching
  the build.
- **Direct cross-origin only** (ADR-0007 as-is): simplest configuration, but exposed
  to third-party-cookie restrictions.

## Correction (2026-09-02)
The **Known fragility** paragraph above misstates nginx's history. nginx has mapped
`.js` to `application/javascript` in its bundled `conf/mime.types` since 1.5.4
(27 Aug 2013), when it replaced `application/x-javascript`, and still does on
`master`; the mapping is identical on `release-1.20.2`, `release-1.21.1`,
`release-1.27.5` and `release-1.29.0`. No release emits `text/javascript`, so a
bump of the `nginx:1.27-alpine` base image cannot flip the type. Checked against
those release branches and `nginx.org/en/CHANGES`.

The decision stands and the fragility is real, but its cause is narrower than
recorded: the rewrite depends on whatever serves the bundle continuing to label it
with a type listed in `sub_filter_types`, which a change of serving product or an
edited MIME map could break — not a version bump. Two things follow, both now in
place. `sub_filter_types` lists `application/javascript text/javascript`, and the
detection this section called cheap runs on every frontend deploy; see
[ADR-0010 (frontend)](../../../frontend/architecture/09-decisions/adr-0010-verifying-frontend-deploys.md).

The Decision section's parenthetical also predates the change that dropped the
implicit `text/html`, and the Context section names Fly.io, which the backend left
in August 2026. Both are left as written. An ADR records what was decided and on
what understanding; this note records where the understanding was wrong.
