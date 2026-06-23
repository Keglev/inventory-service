# ADR-0004: HTTP status as the error envelope (no success wrapper)

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2025-06-01

## Context
REST APIs must communicate both success and failure to clients. Two broad patterns
exist: use HTTP status codes as the semantic signal and let the body carry domain
data or an error object; or wrap every response — success and failure — in a generic
envelope object (e.g., `{ "success": true, "data": {...} }`).

Forces/constraints:
- **HTTP semantics**: clients (the React SPA, `curl`, monitoring tools) already
  treat 2xx/4xx/5xx meaningfully; duplicating that signal in a wrapper field adds
  no information.
- **Consistency**: every error response must have exactly the same shape so the
  frontend can handle errors generically without inspecting the status code and then
  pattern-matching the body structure.
- **No over-exposure**: error bodies must not leak server internals (stack traces,
  SQL, class names).
- **Standards alignment**: standard Spring Boot error handling and OpenAPI tooling
  model per-status response bodies naturally; a generic wrapper requires custom
  schema descriptions everywhere.

## Decision
HTTP status codes carry the semantic result. Error responses use a single canonical
shape; success responses return the domain object (or collection) directly with no
wrapper.

**Error body** (all 4xx and 5xx responses):
```json
{ "error": "not_found", "message": "Supplier not found", "timestamp": "2025-..." }
```

- `error` — `HttpStatus.name().toLowerCase()` (e.g. `bad_request`, `not_found`,
  `conflict`, `internal_server_error`)
- `message` — human-readable description, sanitized before reaching the client (see
  [ADR-0005](./adr-0005-error-message-sanitization.md))
- `timestamp` — ISO-8601 instant the error occurred (`Instant.now().toString()`)

**Success body**: the domain DTO or list directly (e.g., `InventoryItemDTO`,
`List<SupplierDTO>`). No `{ "success": true, "data": [...] }` wrapper.

Static-resource 404s return no body (`void` handler with `@ResponseStatus`).

## Alternatives Considered

1. **Generic success wrapper** (`{ "success": true, "data": {...}, "meta": {...} }`)
   - Pros:
     - Consistent outer envelope for all responses
     - Can carry pagination metadata alongside the payload
   - Cons:
     - Every client call must unwrap before using the data
     - OpenAPI schema for every endpoint becomes `{ data: T }` instead of `T`
       — adds noise to generated documentation
     - Pagination metadata is better handled via `Link` headers or a dedicated
       paginated-result type used only where needed

2. **Problem Details (RFC 9457 / `application/problem+json`)**
   - Pros:
     - Standardised error schema; supported by Spring 6 via `ProblemDetail`
   - Cons:
     - Adds `type`, `title`, `status`, `detail`, `instance` fields most of which
       duplicate information already carried by the HTTP status and message
     - Requires Spring to be configured to produce `application/problem+json`
       content type, complicating the frontend's `Accept` header handling
     - Overkill for a portfolio project without a published third-party API

3. **No error body — status code only**
   - Pros:
     - Maximum simplicity
   - Cons:
     - Frontend cannot show a meaningful error message to the user
     - Debugging failed requests requires log access

## Consequences

### Positive
- The frontend handles all errors with one generic function: read
  `response.body.error` and `response.body.message`.
- Success responses are directly usable without unwrapping.
- OpenAPI schemas map 1:1 to domain types; generated client code is idiomatic.
- The `error` token is stable (it is `HttpStatus.name().toLowerCase()`) and
  can be used as a key for i18n message lookup.

### Negative / Tradeoffs
- There is no standard place to carry pagination metadata in success responses;
  paginated endpoints encode total count inside the DTO or use response headers.
- The three-field error shape is a project convention, not an HTTP standard.
  Consumers outside the React SPA must be told about it.

## Implementation Notes
- Where it is implemented:
  - `src/main/java/com/smartsupplypro/inventory/exception/dto/ErrorResponse.java`
    — `record ErrorResponse(String error, String message, String timestamp) {}`
  - `src/main/java/com/smartsupplypro/inventory/exception/GlobalExceptionHandler.java`
    — `respond()` helper: `new ErrorResponse(status.name().toLowerCase(), message, Instant.now().toString())`
  - `src/main/java/com/smartsupplypro/inventory/exception/BusinessExceptionHandler.java`
    — same `respond()` pattern; both handlers produce identical `ErrorResponse` structure

- Migration notes (if relevant):
  - Any new `@ControllerAdvice` handler must use the same `ErrorResponse` record
    and the same `status.name().toLowerCase()` token derivation

- Testing implications:
  - Controller tests assert on HTTP status code AND on the `error` / `message`
    fields of the response body
  - The `timestamp` field is asserted to be non-null (exact value is non-deterministic)

## References
- [§6 Runtime View](../06-runtime.md) — exception-to-status reference table and
  error-path sequence diagrams
- [§8 Exception Handling](../08-concepts.md) — handler order, sanitize() behaviour
- [ADR-0005: Error message sanitization](./adr-0005-error-message-sanitization.md)
