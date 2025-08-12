# Security Overview

This document summarizes how authentication, authorization, cookies, and CORS are implemented in the **Inventory Service** stack.

---

## 1 Authentication (Google OAuth2 + Spring Security)

- **Flow**: Browser → Google OAuth (authorization code) → Backend exchanges code for tokens → App establishes **server session**.
- **Framework**: Spring Security (OAuth2 Client).  
- **User model**: First successful login triggers lightweight onboarding via `OAuth2LoginSuccessHandler`:
  - Lookup `AppUser` by email.
  - Create if missing with role `USER`.
  - No self-service signup flows; admin elevation is manual.
- **Session**: Session cookie is used (no JWT). See “Cookies” below.

### OAuth2 details
- Authorization endpoint: `https://accounts.google.com/o/oauth2/v2/auth`
- Token endpoint: `https://oauth2.googleapis.com/token`
- Scopes: `openid`, `profile`, `email`

## 2 Authorization (Endpoint Access Rules)
Access control is enforced centrally in SecurityConfig.

- **Public**

- /

- /health/**, /actuator/**

- OAuth routes: /oauth2/**, /login/**, /login/oauth2/**, /error

### Authenticated

- /api/** (valid session required)

### Admin only

- /api/admin/** (requires ADMIN authority)

- Method security is enabled with @EnableMethodSecurity, so you can gate methods like:

## @PreAuthorize("hasAuthority('ADMIN')")

## 3 Error Handling (API vs Browser)
We return different responses based on request type:

- API requests (path starts with /api/ and Accept: application/json)

- Unauthenticated → 401 with JSON body:

  ## { "message": "Unauthorized" }

  ## Browser requests

## Unauthenticated → 302 redirect to /oauth2/authorization/google.

## 4 Cookies & Sessions

- Auth model: Server-side session (no JWT).

- Cookie: configured via CookieSerializer

- SameSite=None

- Secure=true

- Path=/

**Why: Enables cross-site cookie usage from the SPA origin over HTTPS.**

- Logout: POST /logout (or GET if enabled) invalidates session and deletes JSESSIONID / SESSION.

- Example Set-Cookie (conceptual)

  ## Set-Cookie: SESSION=abc123; Path=/; Secure; SameSite=None; HttpOnly

### OpenAPI note
- Document session usage by requiring cookieAuth on secured operations (see Section 2). No token is sent in headers or query string.

## 5 CORS
CORS is configured to support the dev SPA and production frontend.

**Allowed origins**

- http://localhost:5173

- https://localhost:5173 (if used)

- https://inventoryfrontend.fly.dev (update when prod URL changes)

- Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

- Allowed headers: *

- Exposed headers: Set-Cookie

- Credentials: true

- Max age: 3600 seconds

## Preflight example

  OPTIONS /api/items
  Origin: http://localhost:5173
  Access-Control-Request-Method: GET

## Expected response headers

HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Access-Control-Allow-Headers: *
Access-Control-Allow-Credentials: true
Vary: Origin

## 6 CSRF
- Current project choice: CSRF disabled globally (portfolio simplification).

- Production guidance:

  - Prefer enabling CSRF.

  - Exempt pure REST routes (/api/**) or use CSRF tokens for browser-submitted forms.

  - Keep OAuth login and logout flows compatible with your CSRF model.

**No OpenAPI change is needed for CSRF; it’s a transport/browser concern**.

## 7 Health Endpoints
- Public, lightweight:

  - /health (simple 200 OK—no DB calls)

  - If Actuator is enabled: /actuator/health

## DB-specific checks:

- Keep separate (e.g., /health/db) and understand they may fail due to upstream allowlists.

- If exposing DB checks publicly, make responses minimal (no secrets) and document potential failure modes.

## 8 Testing Strategy (Security)
Focus on slice tests that load your real SecurityConfig but only stub controllers as needed.

### What to verify

- /api/admin/**:

  - ADMIN → 200

  - USER → 403

- Unauthenticated API request → 401 JSON ({"message":"Unauthorized"})

- /oauth2/authorization/google is permitted (3xx)

- CORS preflight from dev origin succeeds and includes
  - Access-Control-Allow-Origin and Access-Control-Allow-Credentials: true

**MockMvc snippets**

// ADMIN can access admin endpoints
@WithMockUser(authorities = "ADMIN")
mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
   .andExpect(status().isOk());

// USER is forbidden on admin endpoints
@WithMockUser(authorities = "USER")
mvc.perform(get("/api/admin/ping").accept(MediaType.APPLICATION_JSON))
   .andExpect(status().isForbidden());

// Unauthenticated API request → 401 JSON (not a redirect)
mvc.perform(get("/api/items").accept(MediaType.APPLICATION_JSON))
   .andExpect(status().isUnauthorized())
   .andExpect(content().contentType(MediaType.APPLICATION_JSON))
   .andExpect(content().json("{\"message\":\"Unauthorized\"}"));

// OAuth authorization endpoint is permitted
mvc.perform(get("/oauth2/authorization/google"))
   .andExpect(status().is3xxRedirection());

// CORS preflight for dev origin
mvc.perform(options("/api/items")
        .header("Origin", "http://localhost:5173")
        .header("Access-Control-Request-Method", "GET"))
   .andExpect(status().isOk())
   .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
   .andExpect(header().string("Access-Control-Allow-Credentials", "true"));



 Each OpenAPI spec declares:
```yaml
components:
  securitySchemes:
    OAuth2:
      type: oauth2
      flows:
        authorizationCode:
          authorizationUrl: https://accounts.google.com/o/oauth2/v2/auth
          tokenUrl: https://oauth2.googleapis.com/token
          scopes:
            openid: OpenID Connect scope
            profile: Access basic profile
            email: Access email
