# ADR-0007: Cross-origin session cookie configuration for split frontend/backend deployment

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

> **Currency note (2026-07-13):** the direct cross-origin path this ADR documents
> remains configured and functional but is no longer the active production topology;
> browser traffic is same-origin via the serve-time rewrite proxy. See
> [ADR-0008](adr-0008-serve-time-api-base-rewrite.md).

## Date
2025-11-15 

## Context
SmartSupplyPro is deployed as two separate services on two different origins: the
React frontend on Koyeb (`https://inventory-service.koyeb.app`) and the Spring Boot
backend on Fly.io (`https://inventoryservice.fly.dev`). Authentication is Google
OAuth2, and the authenticated session is carried by a server-issued cookie rather than
a token held in browser storage.

Because the browser sends requests from the Koyeb origin to the Fly.io origin, every
authenticated API call is **cross-origin**. The default browser cookie policy does not
send cookies on cross-site requests, which breaks the session the moment the frontend
and backend live on different domains. Two further mechanics matter:

- The OAuth2 **authorization request state** (the value Spring Security needs to
  correlate the redirect back from Google with the originating request) must survive a
  full-page redirect away to Google and back. The default in-memory
  `HttpSessionOAuth2AuthorizationRequestRepository` relies on a server-side session,
  which is fragile across the redirect in this split, stateless-leaning topology.
- After a successful login, the backend must hand control back to the **frontend**,
  not render a backend page.

Forces/constraints:
- **Cross-site delivery**: the session cookie must be sent by the browser on requests
  from the Koyeb origin to the Fly.io origin.
- **Security**: relaxing the cross-site rule must not expose the cookie to JavaScript
  (XSS) or allow transmission over plaintext.
- **OAuth2 state survival**: the authorization-request state must persist across the
  redirect to Google without depending on a sticky server-side session.
- **Correct landing**: OAuth2 success must return the user to the frontend SPA, not to
  a backend route.

## Decision
Configure the session cookie as **`SameSite=None; Secure; HttpOnly`** and store the
OAuth2 authorization-request state in a cookie via a custom repository.

- **`SameSite=None`** instructs the browser to include the cookie on cross-site
  requests, which is required because the frontend (Koyeb) and backend (Fly.io) are
  different registrable domains.
- **`Secure`** is mandatory whenever `SameSite=None` is set: browsers reject a
  `SameSite=None` cookie that is not also `Secure`. Both deployments serve over HTTPS,
  so this holds in all environments except plain-HTTP local development.
- **`HttpOnly`** keeps the cookie unreadable from JavaScript, preserving the main
  defence against session theft via XSS that the cross-site relaxation would otherwise
  weaken.
- The OAuth2 authorization-request state is persisted with a custom
  `CookieOAuth2AuthorizationRequestRepository` (an HttpOnly cookie) instead of the
  default session-backed repository, so the state survives the redirect to Google and
  back without a sticky server session.
- On successful authentication, `OAuth2LoginSuccessHandler` (extending
  `SimpleUrlAuthenticationSuccessHandler`) redirects to the frontend's **`/auth`**
  route (not `/dashboard` and not a backend page), where the SPA takes over. The
  redirect origin is taken from the OAuth2 return cookie and validated against the
  configured `AppProperties.cors.allowedOrigins` allow-list before use, falling back to
  `frontend.baseUrl + frontend.landingPath` if validation fails — preventing an
  open-redirect via a forged return origin.

CORS on the backend (`CorsConfig`) sets `setAllowCredentials(true)` and exposes the
`Set-Cookie` header via `setExposedHeaders`, so the browser is permitted to attach and
receive the cross-site cookie. Allowed origins come from the configured
`AppProperties.cors.allowedOrigins` list (the production Koyeb origin is injected via
`application-prod.yml`, not hardcoded in Java).

## Alternatives Considered

1. **Same-origin deployment (reverse-proxy frontend and backend under one domain)**
   - Pros: cookies stay first-party; `SameSite=Lax` works; no cross-site relaxation
     needed.
   - Cons: requires a shared ingress / proxy layer in front of both services; couples
     two independently deployed apps on two providers (Koyeb, Fly.io) into one routing
     surface. Rejected to keep the two deployments independent.

2. **Bearer token (JWT) in `Authorization` header, held in browser storage**
   - Pros: stateless; no cookie cross-site policy to fight.
   - Cons: token in `localStorage`/`sessionStorage` is reachable by JavaScript and a
     direct XSS exfiltration target; loses the HttpOnly protection a cookie gives.
     Rejected on security grounds.

3. **`SameSite=Lax` or `Strict`**
   - Pros: stronger CSRF posture by default; no `Secure`-coupling requirement.
   - Cons: the browser would not send the cookie on the cross-site Koyeb→Fly.io
     request at all, so the session simply would not work in this topology. Not viable.

4. **Default session-backed OAuth2 authorization-request repository**
   - Pros: zero custom code; Spring Security default.
   - Cons: depends on a server-side session surviving the external redirect to Google;
     brittle across the split deployment. Replaced by the cookie-backed repository.

## Consequences

### Positive
- The session works across the two-origin deployment: the browser attaches the cookie
  on every cross-site call from Koyeb to Fly.io.
- `HttpOnly` is retained, so the cross-site relaxation does not open a JavaScript-based
  session-theft path; the cookie is never exposed to SPA code.
- OAuth2 login state survives the Google redirect without a sticky server session,
  keeping the backend closer to stateless.
- The two services stay independently deployable; no shared proxy or single-domain
  coupling is required.

### Negative / Tradeoffs
- `SameSite=None` widens the cross-site surface; the CSRF posture now rests on the
  combination of `HttpOnly`, `Secure`, and the backend's credentialed CORS allow-list
  rather than on the cookie's same-site rule.
- `Secure` is required, so the cookie cannot be delivered over plain HTTP. Local
  development that does not use HTTPS needs a profile-specific accommodation.
- The CORS allow-list and the cookie configuration are now coupled: an origin change on
  either deployment (new Koyeb or Fly.io URL) requires updating both, or auth breaks
  silently in the browser.

## Implementation Notes
- Cookie attributes (`SameSite=None; Secure`) are set on a dedicated cookie serializer
  bean; CORS (credentials, allowed origins, exposed `Set-Cookie` header) is configured
  in `CorsConfig`. See §5 Cross-cutting.
- `CookieOAuth2AuthorizationRequestRepository` serialises the OAuth2 authorization
  request into an HttpOnly cookie in place of the default session-backed repository.
- `OAuth2LoginSuccessHandler.onAuthenticationSuccess` performs the post-login redirect,
  building the target as `{validatedOrigin}/auth` where the origin is validated against
  `AppProperties.cors.allowedOrigins`; the fallback target is
  `frontend.baseUrl + frontend.landingPath` (`/auth`).
- CORS (`CorsConfig`) enables credentials and exposes `Set-Cookie`, so the browser may
  send and receive the cross-site cookie; allowed origins are the configured
  `AppProperties.cors.allowedOrigins` list.
- Local development caveat: because `Secure` blocks plain-HTTP delivery, the default
  profile's allowed origins include an HTTPS localhost variant
  (`https://localhost:5173` alongside the plain-HTTP ones); verify the cookie is
  delivered when testing auth locally over HTTP.

## References
- [§5 Building Block View](../05-building-blocks.md#cross-cutting) — Spring Security,
  OAuth2 success handler, and the cookie-backed authorization-request repository
- [§8 Concepts](../08-concepts.md) — CORS origins and security concepts
