# Security API — Enterprise Guide

This document consolidates security-focused API information for SmartSupplyPro. It is written for architects, backend engineers, and security reviewers who need a clear, enterprise-grade reference covering authentication flows, endpoints, session handling, cookie vs token trade-offs, CORS considerations, provisioning, RBAC, and operational guidance.

## Quick links

- ReDoc interactive API: https://keglev.github.io/inventory-service/api/redoc/api.html
- OAuth2 architecture: https://keglev.github.io/inventory-service/api/redoc/oauth2-security-architecture.html
- Security architecture index: ../architecture/security/README.md

## Goals

- Describe supported authentication flows (OAuth2 Authorization Code + OIDC)
- Describe security-related API endpoints and example calls (/api/me, /api/me/authorities, /auth/logout)
- Document cookie and token handling used by the backend (SameSite, HttpOnly, Secure, lifetimes)
- Provide guidance for CORS, return URL validation and open-redirect hardening
- Explain provisioning, default roles, and admin allow-list behavior
- Provide examples, troubleshooting tips, and links to architecture-level patterns

## Supported flows

1. OAuth2 Authorization Code with PKCE (frontend-initiated) — primary flow for SPA clients using Google as an IdP.
2. OpenID Connect ID token processing for user identity extraction and verification.

See the detailed architecture: https://keglev.github.io/inventory-service/api/redoc/oauth2-security-architecture.html

## Important endpoints

- GET /api/me — Returns the authenticated user's profile (AppUserProfileDTO). Requires an authenticated session.
- GET /api/me/authorities — Returns a list of authority strings for the current user (e.g. ["ROLE_USER", "ROLE_ADMIN"]).
- POST /auth/logout — Clears server-side session (if any) and removes auth cookies; returns 204 No Content on success.

Example (curl-like):

GET /api/me

Response 200 (application/json)

{
  "email": "alice@example.com",
  "name": "Alice Example",
  "role": "USER",
  "createdAt": "2024-01-01T12:00:00Z"
}

## Cookie vs Token strategy

The service uses a cookie-based session for browser clients (HttpOnly + Secure + SameSite=None) to support cross-origin OAuth2 flows and a stateless authorization-request cookie during the OAuth2 handshake.

Design rationale:

- Cookies (HttpOnly) prevent JavaScript access and mitigate XSS risk for session tokens used by browsers.
- SameSite=None is required for cross-origin OAuth2 redirects; set Secure in production.
- Short lifetimes reduce exposure (authorization request cookie: ~3 minutes; return URL cookie: ~5 minutes; session cookie: session-scoped).
- For API-to-API or non-browser clients, prefer bearer tokens (JWT or short-lived access token) through an authorization header.

Security checklist for cookies:

- Always set HttpOnly unless frontend must read the cookie (only SSP_RETURN is readable by frontend).
- Set Secure when running behind HTTPS/load balancer.
- Use proper path scoping and minimal cookie payloads.

## CORS and Return URL validation

- Maintain a strict allowlist of return URLs to prevent open redirect attacks. See implementation pattern under `docs/architecture/patterns/oauth2-security-architecture.md`.
- Configure CORS to only allow known frontends and specific methods/headers used by the SPA.

## Provisioning and RBAC

- Users authenticated through OAuth2 are automatically provisioned with a default role of USER.
- Admins can be configured via the `APP_ADMIN_EMAILS` allow-list (see `AppProperties` in the codebase). When present, matching emails receive elevated roles.
- Enforce RBAC via method-level `@PreAuthorize` checks and centralized role enums (`Role`). See `rbac-patterns.md` for hierarchy and policy examples.

## Examples and troubleshooting

- Cross-origin login failing: verify SameSite cookie attributes, Secure flag, and X-Forwarded-Proto handling from the load balancer.
- Missing authorities response: ensure principal is not anonymous and that the `CustomOAuth2UserService` returns the local `AppUser` with assigned roles.

## Operational considerations

- Logging and audit: log authentication successes, suspicious return URL attempts (invalid allowlist), and cookie lifecycle events.
- Monitoring: track OAuth2 success/failure counts, user provisioning rates, and unusual spikes in open-redirect attempts.
- Incident response: have a process to revoke sessions by rotating cookie names or invalidating server-side session store if used.

## References and related docs

- Architecture patterns: `docs/architecture/patterns/oauth2-security-architecture.md`
- Implementation patterns: `docs/architecture/patterns/security-implementation-patterns.md`
- Security testing: `docs/architecture/patterns/security-testing-guide.md`
- OpenAPI interactive reference: `docs/api/redoc/api.html`

--
Generated/updated by documentation assistant on October 21, 2025.
# Security API Index

This is a placeholder index for security-related API endpoints and documentation.

- **Authentication**: See `docs/api/endpoints/authentication.md` for OAuth2 flows.
- **Sessions**: Session management and cookie policies.
- **Tokens**: Token lifecycle, refresh and revocation.

(Placeholder created so `docs/api-overview.md` links resolve. Replace with the canonical security API index content.)
