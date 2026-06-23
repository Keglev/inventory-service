# ADR-0005: Error message sanitization in GlobalExceptionHandler

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2025-06-01

## Context
When an exception is caught and its message is forwarded to the client inside
an `ErrorResponse`, the raw exception message may contain server-internal detail:
file system paths, fully-qualified Java class names, raw SQL fragments, or
credential strings that leaked into an exception's message field. Returning these
to the client violates the principle of minimal disclosure and is a common finding
in security audits.

Forces/constraints:
- **Information disclosure**: stack-trace details and SQL help an attacker map
  the server's internal structure.
- **Credential safety**: if a password or token string is accidentally included
  in an exception message, it must not reach the client or be logged in a
  response body.
- **Usefulness**: the sanitized message must still be human-readable; replacing
  every message with `"error"` defeats the purpose of having a `message` field.
- **Single enforcement point**: sanitization must happen in one place so that
  adding a new exception handler does not silently bypass it.

## Decision
`GlobalExceptionHandler` applies a `sanitize()` method to all exception messages
before they are placed in the `ErrorResponse`. The method applies six sequential
regex replacements:

| Pattern | Replacement | Catches |
|---|---|---|
| `\b[A-Za-z]:\\[\w\\.-]+` | `[PATH]` | Windows drive paths (`C:\...`) |
| `/[\w/.-]+\.(java\|class)` | `[INTERNAL]` | Unix paths ending in `.java` or `.class` |
| `\bcom\.smartsupplypro\.[\w.]+` | `[INTERNAL]` | Fully-qualified class names |
| `(?i)\bSQL.*` | `Database operation failed` | SQL fragments and JDBC error text |
| `(?i)\bPassword.*` | `Authentication failed` | Credential strings |
| `(?i)\bToken.*` | `Authentication failed` | Token strings |

A `null` input returns `"Unknown error"`.

Sanitization is applied in `GlobalExceptionHandler` only. `BusinessExceptionHandler`
handles domain exceptions whose messages are authored in application code and are
already safe to expose.

## Alternatives Considered

1. **Return a fixed generic message for all exceptions**
   - Pros:
     - Zero disclosure risk
   - Cons:
     - `"An error occurred"` is useless to the developer and to the frontend for
       displaying meaningful validation feedback
     - Validation errors (`MethodArgumentNotValidException`) need to tell the user
       which field failed; a fixed message makes this impossible

2. **Allowlist-based approach (only pass messages that match known safe patterns)**
   - Pros:
     - Stronger guarantee; nothing leaks unless explicitly permitted
   - Cons:
     - High maintenance: every new exception message must be added to the allowlist
     - Framework exceptions (Spring, Hibernate) produce messages outside our control

3. **Denylist at the logging layer only (not in the response)**
   - Pros:
     - Keeps internal messages available in logs for debugging
   - Cons:
     - The response body still exposes internal detail to the client; a frontend
       user or network observer sees the raw message

4. **Structured error codes with no message text**
   - Pros:
     - No free-text disclosure at all
   - Cons:
     - Requires maintaining a lookup table of every possible error code
     - Validation messages (field name + constraint description) cannot be reduced
       to a single code without losing actionability

## Consequences

### Positive
- Server paths, class names, SQL, and credential strings are stripped before the
  response leaves the JVM.
- The `message` field remains actionable for validation errors (field name + rule)
  and domain errors (authored in application code).
- One method, one location: adding a new `@ExceptionHandler` in `GlobalExceptionHandler`
  automatically benefits from sanitization via the shared `respond()` helper.

### Negative / Tradeoffs
- The regex rules are order-dependent and string-based; a novel internal detail
  that does not match any pattern will pass through unsanitized. This is a
  known gap — the rules catch the most common leak patterns, not all possible ones.
- `DataIntegrityViolationException` (JDBC constraint violations) bypasses
  `sanitize()` entirely: its handler returns a hardcoded string
  (`"Data conflict - constraint violation"`) because JDBC messages always contain
  table/column names that would otherwise require sanitization.
- Developers debugging in production must use application logs, not the response
  body, to see the original exception message.

## Implementation Notes
- Where it is implemented:
  - `src/main/java/com/smartsupplypro/inventory/exception/GlobalExceptionHandler.java`
    — `private String sanitize(String message)` (lines 145–155)
  - Called by the `respond()` helper for: `handleValidation`, `handleConstraint`,
    `handleAccessDenied`, `handleNotFound`, `handleResponseStatus`
  - NOT called by: `handleDataIntegrity` (hardcoded message), `handleAuthentication`
    (hardcoded message), `handleUnexpected` (hardcoded message)

- Migration notes (if relevant):
  - Any new `@ExceptionHandler` added to `GlobalExceptionHandler` should call
    `sanitize()` on the message before passing it to `respond()`
  - If new internal package names are added (e.g., a new root package), the
    third regex pattern (`\bcom\.smartsupplypro\.[\w.]+`) should be extended

- Testing implications:
  - Unit tests for `GlobalExceptionHandler` should include cases where the
    exception message contains a Windows path, a class name, and a SQL fragment,
    and assert that the sanitized replacement strings appear in the response body

## References
- [§8 Exception Handling](../08-concepts.md) — handler order, error contract, full
  sanitize() behaviour summary
- [ADR-0004: HTTP status as envelope](./adr-0004-http-status-as-envelope.md) —
  the `ErrorResponse` shape that sanitized messages flow into
