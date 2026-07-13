# §8 Cross-cutting Concepts

## Security

Authentication uses the OAuth2 Authorization Code flow with Google as the sole identity
provider. The code exchange is server-to-server; the browser never sees a token.
`CookieOAuth2AuthorizationRequestRepository` serialises the OAuth2 state parameter into
an HTTP-only cookie (`OAUTH2_AUTH_REQUEST`, TTL 180 s, configurable via
`AppProperties.Cookie`). User provisioning happens at token load: `CustomOAuth2UserService` and
`CustomOidcUserService` call `UserProvisioningService.provision(email, name, isAdmin)`
— the single authoritative provisioner — which finds or creates the `AppUser` and
heals its role against the admin allow-list on every login. `OAuth2LoginSuccessHandler`
then only validates the principal attributes and redirects to
`AppProperties.frontend.baseUrl + landingPath`.

The two lifecycle edges are handled explicitly. On OAuth2 failure, a dedicated
failure handler (`OAuth2Config`) logs the cause and redirects the browser to the
frontend login page with `?error=oauth` instead of surfacing a raw Spring error page.
Logout is `POST /api/auth/logout`, which invalidates the server-side session and
clears the session cookie; the frontend then returns the user to the login view.

Two roles — `ADMIN` (full CRUD, analytics) and `USER` (read + basic stock ops) — are
stored as `STRING` on `AppUser.role`. Every mutating endpoint carries `@PreAuthorize`;
the frontend hides UI elements, but the backend enforces each rule independently and
does not trust the client's claimed role.

**Demo mode**: `AppProperties.isDemoReadonly` (env `APP_DEMO_READONLY`, default `true`
in prod) permits unauthenticated read access. The flag is evaluated inside the
`@PreAuthorize` SpEL expression on each endpoint — `SecuritySpelBridgeConfig` exposes
the properties bean to SpEL as `@appProperties` — and it does not disable the security
filter chain.

Session cookies are `HttpOnly`, `Secure=true`, `SameSite=None`. With the serve-time
rewrite proxy active, browser traffic is same-origin and the proxied path does not
itself require `None`; the attribute is retained to keep the direct Fly.io-origin
path functional (see [ADR-0008](09-decisions/adr-0008-serve-time-api-base-rewrite.md)). CORS allowed origins are configured per
profile in `AppProperties.cors.allowedOrigins`
(default: `http://localhost:5173`; prod: `https://inventory-service.koyeb.app`).

See [§5 Cross-cutting](05-building-blocks.md#cross-cutting).

---

## Validation

Three tiers enforce data integrity in sequence:

1. **Controller — JSR-380** (`@Valid` on `@RequestBody`): Bean Validation constraints
   (`@NotBlank`, `@NotNull`, `@Size`, `@Positive`, etc.) fire before the method body
   executes. Failures throw `MethodArgumentNotValidException` → 400.

2. **Service — business rules**: dedicated validator classes (`SupplierValidator`,
   `InventoryItemValidator`, `InventoryItemLookupValidator`,
   `InventoryItemSecurityValidator`, `StockHistoryValidator`) enforce uniqueness,
   referential integrity, and state guards that require database reads. Failures throw
   `InvalidRequestException` → 400 or `DuplicateResourceException` → 409.

3. **Database — constraints**: `NOT NULL`, `UNIQUE`, and foreign-key constraints in
   Oracle act as the final safety net. Violations surface as
   `DataIntegrityViolationException` → 409. SQL detail is stripped by
   `GlobalExceptionHandler.sanitize()` before the message reaches the client.

**SKU** — every inventory item carries a Stock Keeping Unit: required on create and
update, globally unique, enforced both in the service tier and by database constraints
(Flyway V4). Because deletion is soft, a deleted item's SKU stays reserved by the
unique constraint — reusing it requires a distinct value, which keeps historical
records unambiguous.

See [§5 Cross-cutting](05-building-blocks.md#cross-cutting).

---

## Exception Handling

Two `@ControllerAdvice` handlers cover all exceptions without overlap:

**`BusinessExceptionHandler`** (`@Order(HIGHEST_PRECEDENCE)`) handles domain exceptions:

| Exception | Status |
|---|---|
| `InvalidRequestException` | 400 |
| `DuplicateResourceException` | 409 |
| `IllegalStateException` | 409 |

**`GlobalExceptionHandler`** (`@Order(HIGHEST_PRECEDENCE + 1)`) handles framework exceptions:

| Exception | Status |
|---|---|
| `MethodArgumentNotValidException`, `ConstraintViolationException`, `HttpMessageNotReadableException` | 400 |
| `AuthenticationException` | 401 |
| `AccessDeniedException` | 403 |
| `NoSuchElementException`, `IllegalArgumentException` | 404 |
| `DataIntegrityViolationException`, `ObjectOptimisticLockingFailureException` | 409 |
| `Exception` (fallback) | 500 |

**Error contract** — every response body (except static-resource 404s, which return no
body) is:

```json
{ "error": "not_found", "message": "...", "timestamp": "2025-..." }
```

`error` = `HttpStatus.name().toLowerCase()` (e.g. `bad_request`, `not_found`,
`conflict`). There is no `correlationId` field.

**`sanitize()`** strips the following from exception messages before they reach the
client: Windows and Unix file paths → `[PATH]`; `.java`/`.class` file references and
`com.smartsupplypro.*` class names → `[INTERNAL]`; SQL fragments → `"Database
operation failed"`; strings starting with `Password` or `Token` → `"Authentication
failed"`. A `null` input returns `"Unknown error"`.

See [§5 Cross-cutting](05-building-blocks.md#cross-cutting).

---

See also: [Infrastructure concepts — Configuration, Persistence, Logging](08b-concepts-infra.md)
