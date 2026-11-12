# Quality Requirements

This section makes SmartSupplyPro's quality goals explicit and testable. It refines
the top-level goals stated in the architecture overview — **security**,
**maintainability**, and **separation of concerns** — into a quality tree and a set
of concrete, measurable scenarios. Each scenario points to the decision (§9 ADR) or
view (§5–§8) where the property is realised, so quality goals are traceable rather
than aspirational.

## 10.1 Quality Tree

Top-level quality goals, refined into the sub-characteristics this architecture
actually targets. Separation of concerns and testability sit under maintainability;
correctness and performance sit under reliability.

```mermaid
graph LR
  Q["Quality goals"]
  Q --> SEC["Security"]
  Q --> MNT["Maintainability"]
  Q --> REL["Reliability & correctness"]

  SEC --> SEC1["No internal disclosure in error responses"]
  SEC --> SEC2["Credential safety (wallet and secrets injected at runtime)"]
  SEC --> SEC3["AuthN / AuthZ: OAuth2 + RBAC, same-site session cookie"]

  MNT --> MNT1["Separation of concerns (layered)"]
  MNT --> MNT2["Modifiability via the DTO boundary"]
  MNT --> MNT3["Explicit mapping, no code generation"]
  MNT --> MNT4["Testability via constructor injection"]

  REL --> REL1["Uniform error contract"]
  REL --> REL2["Multi-tier validation"]
  REL --> REL3["N+1 avoidance on hot paths"]
```

## 10.2 Quality Scenarios

Each scenario is a stimulus → response pair with a concrete measure. The source
column links to the decision or view that guarantees it.

| ID | Quality goal | Scenario (stimulus → response) | Measure / source |
|------|--------------|--------------------------------|------------------|
| Q-01 | Security — no internal disclosure | An exception whose message carries a file path, class name, SQL fragment, or credential is thrown while handling a request | Response body contains none of them — replaced by `[PATH]`, `[INTERNAL]`, `Database operation failed`, or `Authentication failed`. See [ADR-0005](./09-decisions/adr-0005-error-message-sanitization.md), [§8](./08-concepts.md) |
| Q-02 | Security — credential safety | The production image and the host configuration are inspected | The image and repository contain no credential material at all — the wallet, its password, and the schema credentials are delivered at runtime from the host environment file; startup fails fast if any is missing. See [ADR-0009](./09-decisions/adr-0009-runtime-wallet-delivery.md) |
| Q-03 | Security — session | A signed-in browser calls `/api` on `www.smartsupplypro.de`, which the frontend's Nginx proxies to the backend at `api.smartsupplypro.de` | The session cookie is sent `HttpOnly; Secure; SameSite=Lax` and the request authenticates; a cross-site form cannot carry the cookie. OAuth2 success redirects to the frontend's landing path (`/auth`). See [§6](./06-runtime.md), [ADR-0008](./09-decisions/adr-0008-serve-time-api-base-rewrite.md) |
| Q-04 | Maintainability — modifiability | A new persisted field is added to an entity | The change is localised to the entity, its DTO, and one mapper method; no controller or repository signature changes. See [ADR-0002](./09-decisions/adr-0002-manual-mapping-over-mapstruct.md), [ADR-0003](./09-decisions/adr-0003-dto-boundary-no-entity-exposure.md) |
| Q-05 | Maintainability — API stability | A persistence column is renamed | The public REST contract (DTO JSON shape) is unchanged; the OpenAPI schema diff is empty. See [ADR-0003](./09-decisions/adr-0003-dto-boundary-no-entity-exposure.md) |
| Q-06 | Reliability — error consistency | Any handled failure occurs (validation, not-found, conflict, access-denied, unexpected) | The body is `{error, message, timestamp}` — plus `fieldErrors` when the failure names an input (bean validation, a duplicate name) — with `error == HttpStatus.name().toLowerCase()`; no correlation ID, no stack trace. See [ADR-0004](./09-decisions/adr-0004-http-status-as-envelope.md) |
| Q-07 | Reliability — performance | The inventory list endpoint is queried as the item count grows | Suppliers load via `@EntityGraph` in a single join; the SQL query count stays constant regardless of row count (no N+1). See [§6](./06-runtime.md) |
