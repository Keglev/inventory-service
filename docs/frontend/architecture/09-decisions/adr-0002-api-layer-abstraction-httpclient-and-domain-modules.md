# ADR-0002: API layer abstraction with shared httpClient and domain modules

## Status
Accepted

## Date
2026-03-03

## Context
The frontend talks to multiple backend domains (inventory, suppliers, analytics) and needs consistent behavior for:
- base URL resolution
- cookie-based sessions (`withCredentials`)
- 401 handling / auth boundaries
- resilient parsing and normalization of varied response shapes

Forces/constraints:
- **Consistency:** every API call must behave the same way for credentials, timeouts, and auth boundaries.
- **Maintainability:** avoid re-implementing axios setup and interceptors per domain.
- **Testability:** domain fetchers and hooks should be testable independently.

## Decision
We centralize HTTP concerns in a shared client and organize API logic by domain:

- Shared HTTP client:
  - `frontend/src/api/httpClient.ts`
  - owns baseURL resolution, `withCredentials`, timeout, and 401 redirect policy.

- Domain modules:
  - `frontend/src/api/<domain>/*`
  - optional structure per domain:
    - `hooks/` for React Query hooks
    - `utils/` for normalization/shape tolerance

UI code consumes domain hooks/fetchers rather than importing Axios directly.

## Alternatives Considered
1. **Direct `fetch()` calls inside pages/components**
   - Pros:
     - No abstraction overhead
   - Cons:
     - Duplicates credentials, error handling, baseURL logic
     - Harder to test consistently

2. **One giant “api.ts” file**
   - Pros:
     - Single place to look
   - Cons:
     - Becomes unmaintainable as domains grow
     - Encourages tangling unrelated endpoints

3. **Per-domain HTTP clients** (one axios instance per domain)
   - Pros:
     - Domain isolation
   - Cons:
     - Cross-cutting policies (401 redirect, cookies) drift over time

## Consequences
### Positive
- All consumers get consistent auth boundary behavior (401 redirect rules).
- Domain APIs remain cohesive and testable.
- Normalization utilities can be shared within a domain without polluting UI code.

### Negative / Tradeoffs
- The shared `httpClient` becomes a critical dependency: changes must be careful.
- Some domain exceptions (e.g., probe endpoints) must be encoded centrally.

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Shared: `frontend/src/api/httpClient.ts`
  - Domains:
    - `frontend/src/api/inventory/*`
    - `frontend/src/api/suppliers/*`
    - `frontend/src/api/analytics/*`

- Migration notes (if relevant)
  - Avoid introducing new HTTP clients; extend domain modules instead.

- Testing implications (what should be tested and where)
  - Unit tests for client policies and fetchers under `frontend/src/__tests__/unit/api/*`.

## References
- Architecture docs: [Data Access](../data-access/index.md)
- Diagrams:
  - [Data fetching flow](../diagrams/data-access/data-fetching-flow.md)
  - [HTTP client 401 redirect flow](../diagrams/data-access/http-client-401-redirect-flow.md)
  - [List fetching + normalization](../diagrams/data-access/list-fetching-and-normalization-flow.md)
- Related ADRs: ADR-0001, ADR-0006
