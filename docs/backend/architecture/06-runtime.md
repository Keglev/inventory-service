# §6 Runtime View

## Exception-to-Status Reference

Both `@ControllerAdvice` handlers produce
`{ "error": "...", "message": "...", "timestamp": "..." }`, plus an optional
`fieldErrors` map on bean-validation failures.
The `error` token is `HttpStatus.name().toLowerCase()`. There is no `correlationId`.

| Exception | Handler | Status | `error` token |
|---|---|---|---|
| `InvalidRequestException` | `BusinessExceptionHandler` | 400 | `bad_request` |
| `MethodArgumentNotValidException` | `GlobalExceptionHandler` | 400 | `bad_request` |
| `ConstraintViolationException` | `GlobalExceptionHandler` | 400 | `bad_request` |
| `AuthenticationException` | `GlobalExceptionHandler` | 401 | `unauthorized` |
| `AccessDeniedException` | `GlobalExceptionHandler` | 403 | `forbidden` |
| `NoSuchElementException` | `GlobalExceptionHandler` | **404** | `not_found` |
| `IllegalArgumentException` | `GlobalExceptionHandler` | **404** | `not_found` |
| `DuplicateResourceException` | `BusinessExceptionHandler` | 409 | `conflict` |
| `IllegalStateException` | `BusinessExceptionHandler` | 409 | `conflict` |
| `DataIntegrityViolationException` | `GlobalExceptionHandler` | 409 | `conflict` |
| `HttpMessageNotReadableException` | `GlobalExceptionHandler` | 400 | `bad_request` |
| `MissingServletRequestParameterException`, `MethodArgumentTypeMismatchException` | `GlobalExceptionHandler` | 400 | `bad_request` |
| `NoResourceFoundException` (static assets) | `GlobalExceptionHandler` | 404 | — (no body) |
| `ObjectOptimisticLockingFailureException` | `GlobalExceptionHandler` | 409 | `conflict` (defensive — unreachable today, no entity declares `@Version`) |
| `ResponseStatusException` | `GlobalExceptionHandler` | as thrown | token of the preserved status |
| `Exception` (fallback) | `GlobalExceptionHandler` | 500 | `internal_server_error` |

---

## Scenario 1a — Create Inventory Item: Happy Path

```mermaid
%%{init: {"sequence": {"useMaxWidth": false}}}%%
sequenceDiagram
    participant Client
    participant SF as Spring Security Filter
    participant IC as InventoryItemController
    participant IS as InventoryItemService
    participant VH as InventoryItemValidationHelper
    participant IR as InventoryItemRepository
    participant SR as SupplierRepository
    participant SH as StockHistoryService
    participant DB as Oracle ADB

    Client->>SF: POST /api/inventory (session cookie + JSON body)
    SF->>SF: validate session, populate SecurityContext
    SF->>IC: authenticated request (ADMIN role required)

    IC->>IC: bean validation, groups Default + Create
    IC->>IS: save(dto)
    IS->>VH: validateForCreation(dto)
    VH->>VH: InventoryItemValidator.validateBase(dto)
    VH->>IR: findByNameIgnoreCase(name)
    IR-->>VH: no item with this name at this price
    VH->>IR: findBySkuIgnoreCase(sku)
    IR-->>VH: empty
    VH->>SR: existsById(supplierId)
    SR-->>VH: true
    VH-->>IS: validation passed

    IS->>IS: map dto to InventoryItem
    IS->>VH: populateServerFields: id, createdBy from the session, createdAt, minimumQuantity 10 if unset
    IS->>IR: save(item)
    IR->>DB: INSERT INTO INVENTORY_ITEM
    IS->>SH: INITIAL_STOCK entry, through InventoryItemAuditHelper
    SH->>DB: INSERT INTO STOCK_HISTORY
    Note over IS,DB: both inserts share the transaction of save, so a failed history write rolls back the item
    IS-->>IC: InventoryItemDTO
    IC-->>Client: 201 Created, Location header, InventoryItemDTO
```

## Scenario 1b — Create Inventory Item: Error Path

Three error branches, in the order the checks run; each is answered before
anything is written. The security filter is as in 1a; a caller without the
ADMIN role is refused with 403 before the controller method runs.

```mermaid
%%{init: {"sequence": {"useMaxWidth": false}}}%%
sequenceDiagram
    participant Client
    participant IC as InventoryItemController
    participant IS as InventoryItemService
    participant VH as InventoryItemValidationHelper
    participant IR as InventoryItemRepository
    participant SR as SupplierRepository
    participant BEH as BusinessExceptionHandler
    participant GEH as GlobalExceptionHandler

    Note over Client,GEH: Branch A: a constraint fails (blank name, initial stock below 1, price not above 0)
    Client->>IC: POST /api/inventory
    IC->>IC: bean validation fails
    IC-->>GEH: MethodArgumentNotValidException
    GEH-->>Client: 400 bad_request, fieldErrors per field

    Note over Client,GEH: Branch B: same name at the same price, or same SKU (409)
    Client->>IC: POST /api/inventory
    IC->>IS: save(dto)
    IS->>VH: validateForCreation(dto)
    VH->>IR: findByNameIgnoreCase / findBySkuIgnoreCase
    IR-->>VH: a match
    VH-->>IS: throw DuplicateResourceException
    IS-->>BEH: propagates
    BEH-->>Client: 409 conflict

    Note over Client,GEH: Branch C: unknown supplier (404)
    Client->>IC: POST /api/inventory
    IC->>IS: save(dto)
    IS->>VH: validateForCreation(dto)
    VH->>SR: existsById(supplierId)
    SR-->>VH: false
    VH-->>IS: throw IllegalArgumentException("Supplier does not exist")
    IS-->>GEH: propagates
    GEH-->>Client: 404 not_found
```

## Scenario 2 — OAuth2 Login

```mermaid
%%{init: {"sequence": {"useMaxWidth": false}}}%%
sequenceDiagram
    participant User
    participant Browser
    participant Backend as Spring Boot Backend
    participant CR as CookieOAuth2AuthorizationRequestRepository
    participant Google as Google OAuth2
    participant SH as OAuth2LoginSuccessHandler
    participant UPS as UserProvisioningService
    participant DB as Oracle ADB

    User->>Browser: click "Sign in with Google"
    Browser->>Backend: GET /oauth2/authorization/google
    Backend->>CR: saveAuthorizationRequest(request, response)
    CR-->>Browser: Set-Cookie: oauth2_state (HTTP-only)
    Backend-->>Browser: 302 Redirect to Google authorization URL
    Browser->>Google: GET /o/oauth2/auth?client_id=...&state=...
    User->>Google: enter credentials
    Google-->>Browser: 302 Redirect to /login/oauth2/code/google?code=...&state=...
    Browser->>Backend: GET /login/oauth2/code/google?code=...&state=...
    Backend->>CR: removeAuthorizationRequest(request, response)
    CR-->>Backend: AuthorizationRequest (state verified)
    Backend->>Google: POST /token — exchange code (server-to-server)
    Google-->>Backend: access_token + user info (email, name)
    Note over Backend,UPS: token load — CustomOidcUserService.loadUser
    opt email not on admin allow-list
        Backend-->>Browser: 302 /login?error=unauthorized (access_denied, no account created)
    end
    Backend->>UPS: provision(email, name, isAdmin)
    UPS->>DB: findByEmail(email)

    alt first login
        DB-->>UPS: empty
        UPS->>DB: save new AppUser (role from admin allow-list, createdAt=now)
        DB-->>UPS: AppUser
    else returning user
        DB-->>UPS: AppUser (role healed against allow-list)
    end

    UPS-->>Backend: AppUser
    Backend->>SH: onAuthenticationSuccess(request, response, authentication)
    SH-->>Browser: Set-Cookie SESSION HTTP-only SameSite=None Secure, 302 to /auth
```

Before provisioning, the user service applies an access gate: an email that is
not on the admin allow-list is rejected with `access_denied` and no account is
created, and the failure handler redirects the browser to
`/login?error=unauthorized`. Only allow-listed identities reach the provisioning
steps shown above.

## Scenario 3 — Analytics Read

```mermaid
%%{init: {"sequence": {"useMaxWidth": false}}}%%
sequenceDiagram
    participant Client
    participant SF as Spring Security Filter
    participant AC as AnalyticsController
    participant AS as AnalyticsService
    participant IR as InventoryItemRepository
    participant SMR as StockMetricsRepositoryImpl
    participant DB as Oracle ADB

    Client->>SF: GET /api/analytics/dashboard-summary (session cookie)
    SF->>SF: validate session, populate SecurityContext
    SF->>AC: authenticated (USER or ADMIN role accepted)

    AC->>AS: getDashboardSummary()

    AS->>IR: findAll() with EntityGraph supplier join
    IR->>DB: SELECT INVENTORY_ITEM JOIN SUPPLIER
    DB-->>IR: item + supplier rows (single query, no N+1)
    IR-->>AS: List of InventoryItem

    AS->>SMR: aggregate low-stock count and total stock value
    SMR->>DB: native SQL over INVENTORY_ITEM and STOCK_HISTORY
    DB-->>SMR: aggregated rows
    SMR-->>AS: stock metrics

    AS->>AS: compute WAC snapshot, low-stock items, movement summary
    AS-->>AC: DashboardSummaryDTO
    AC-->>Client: 200 OK — DashboardSummaryDTO
```

## Scenario 4 — Delete Inventory Item: Soft Delete

Deletion never removes the row. A business rule gates the operation: the item must
hold zero stock, so remaining quantity is first drained through audited adjustments.
A permitted delete flips the `active` flag; all stock history survives and the item's
SKU stays reserved by the unique constraint.

```mermaid
%%{init: {"sequence": {"useMaxWidth": false}}}%%
sequenceDiagram
    participant Client
    participant SF as Spring Security Filter
    participant IC as InventoryItemController
    participant IS as InventoryItemService
    participant VH as InventoryItemValidationHelper
    participant REPO as InventoryItemRepository
    participant DB as Oracle ADB

    Client->>SF: DELETE /api/inventory/{id} (session cookie)
    SF->>IC: authenticated request (ROLE_ADMIN required)
    IC->>IS: delete(id)
    IS->>VH: validateForDeletion(id)
    VH->>REPO: load item / check quantity

    alt quantity > 0
        VH-->>IS: InvalidRequestException
        IS-->>IC: propagate
        IC-->>Client: 409 conflict — remove stock via quantity adjustments first
    else quantity == 0
        VH-->>IS: ok
        IS->>VH: validateExists(id)
        VH-->>IS: InventoryItem
        IS->>REPO: save(item with active=false)
        REPO->>DB: UPDATE INVENTORY_ITEM SET ACTIVE=0
        DB-->>REPO: updated
        IC-->>Client: 204 No Content
    end

    Note over IS,DB: delete writes no STOCK_HISTORY row — history is retained and the SKU stays reserved
```
