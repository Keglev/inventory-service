# ADR-0010: Custom domain with a canonical `www` host

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-07-14

## Context
The application was reachable only on the platform-generated hosting subdomain
`inventory-service.koyeb.app`. Two problems followed from that.

First, Google Safe Browsing began serving a "deceptive site" interstitial for the
URL. The application does not collect credentials on-page — sign-in is the standard
Google OAuth2 consent flow — so the classification is a false positive. Its likely
cause is the combination of a shared free-hosting apex with a history of abuse and a
Google-branded sign-in button on a subdomain with no independent reputation. A
warning of that kind is disqualifying for a public-facing portfolio: the first thing
a reviewer sees is a full-page browser block.

Second, the hostname carried the repository name, not the product name, while every
surface of the application — header, footer, Impressum, documentation — is branded
Smart Supply Pro.

Forces/constraints:
- **Independent domain reputation**: safety classifiers must judge this application
  on its own record, not on that of a shared hosting apex.
- **Provider constraint**: Koyeb assigns custom domains by `CNAME`, and a `CNAME`
  cannot legally exist at a zone apex (RFC 1034).
- **One canonical origin**: OAuth2 redirect URIs, the CORS allow-list, and the
  post-login redirect target must all agree on exactly one host, or authentication
  silently breaks.

## Decision
The application is served from `smartsupplypro.de`, with **`www.smartsupplypro.de`
as the single canonical origin**. The apex issues a 301 redirect to it at the DNS
provider; `www` is a `CNAME` to the Koyeb edge.

One configuration property is load-bearing for the move: `app.frontend.base-url`
(`APP_FRONTEND_BASE_URL`) is the base for every post-login and error redirect the
backend issues. It is set in `fly.toml [env]`, so the canonical host is versioned in
git rather than living only in an operator's shell history.

The platform-generated `koyeb.app` hostname still serves the SPA — the provider
always assigns one — but it is not allow-listed as a CORS origin and not registered
as an OAuth2 redirect URI, so it is not a supported entry point.

Note on scope: the hostnames named in the Context of
[ADR-0007](adr-0007-cross-origin-auth-cookie.md) are superseded by this record. The
cookie decision made there is unaffected; only the frontend hostname changed.

## Alternatives Considered

1. **Stay on `koyeb.app` and request a Safe Browsing review**
   - Pros:
     - Free; no DNS work
   - Cons:
     - Treats the symptom. The root cause — no independent domain reputation — is
       unchanged, so re-flagging remains possible
     - Leaves the branding mismatch in place
2. **Apex as the canonical origin, `www` redirecting to it**
   - Pros:
     - Shorter URL
   - Cons:
     - Not available: Koyeb assigns domains by `CNAME`, which cannot exist at the
       apex. An `A` record to a platform IP would pin the deployment to a single
       address and forfeit edge routing
3. **A second subdomain (`api.…`) fronting the backend directly**
   - Pros:
     - Would allow a same-site session cookie in place of `SameSite=None`
   - Cons:
     - Unnecessary. The Nginx layer already reverse-proxies the API and OAuth2 paths
       server-side, so browser traffic is same-origin
       ([ADR-0008](adr-0008-serve-time-api-base-rewrite.md)). Adding a public
       backend hostname would enlarge the attack surface for no gain

## Consequences

### Positive
- Domain reputation is the application's own; the Safe Browsing classification of
  the shared hosting apex no longer applies.
- Host and product name agree across the UI, the documentation, and the URL.
- The Nginx vhost is host-agnostic (`server_name _`, `$host` throughout), so the
  move required no change to the proxy, to the frontend bundle, or to the backend's
  own hostname on Fly.io.

### Negative / Tradeoffs
- A recurring registration cost and a DNS zone to maintain.
- The canonical host is now referenced in four places that must stay in agreement:
  the Google OAuth2 client (JavaScript origin and redirect URI), the CORS allow-list,
  `APP_FRONTEND_BASE_URL`, and the deployment health-check target. A change to one
  without the others breaks login.
- Visitors who type the bare apex depend on a DNS-provider redirect that lives
  outside version control.

## Implementation Notes
- `fly.toml [env]` — `APP_FRONTEND_BASE_URL`.
- `application-prod.yml` — `app.cors.allowed-origins`, `app.frontend.base-url`.
- `.github/workflows/6-deploy-frontend.yml` — `FRONTEND_URL` health-check target.
- DNS (registrar): `www` `CNAME` to the Koyeb edge; apex 301 to the `www` host.
- Google Cloud OAuth2 client: authorized JavaScript origin and redirect URI
  (`/login/oauth2/code/google`) on the canonical host.

## References
- [ADR-0007](adr-0007-cross-origin-auth-cookie.md) — cookie strategy; its Context
  names the superseded hostnames
- [ADR-0008](adr-0008-serve-time-api-base-rewrite.md) — the same-origin proxy that
  makes a public backend hostname unnecessary
- [§7 Deployment View](../07-deployment.md) — topology and diagram
