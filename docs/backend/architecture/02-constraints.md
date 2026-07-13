# §2 Constraints

## Technical Constraints

| Component | Technology | Version |
|---|---|---|
| Language | Java | 21 |
| Framework | Spring Boot | 4.1.0 |
| Database | Oracle Autonomous Database | 23ai |
| Build tool | Maven | 3.x+ |
| Security | Spring Security, OAuth2 | 7.x (Boot-managed) |
| Containerisation | Docker | Latest |
| Testing | JUnit 6 (Jupiter), Mockito | Boot-managed |

**Oracle Autonomous Database** is the sole supported database. Local development and
CI use H2 in Oracle-compatibility mode. There is no PostgreSQL profile.

**Oracle wallet authentication** — the production connection is passwordless via
`cwallet.sso`; only `TNS_ADMIN` must be set at runtime. No password is stored or
injected. See [ADR 0001](09-decisions/adr-0001-oracle-wallet-autologin.md).

## Organizational Constraints

This is a solo-developer portfolio project. Constraints that follow from that context:

- No dedicated DBA, DevOps engineer, or QA function — the developer owns the full stack.
- Decisions favour clarity and long-term maintainability over team velocity or
  framework automation.
- Manual mapping is preferred over annotation-processor frameworks (MapStruct) for the
  same reason. See [ADR 0002](09-decisions/adr-0002-manual-mapping-over-mapstruct.md).

## Conventions

| Convention | Rule |
|---|---|
| API style | RESTful — standard HTTP verbs and status codes; no generic success wrapper. See [ADR 0004](09-decisions/adr-0004-http-status-as-envelope.md) |
| Access control | RBAC via `@PreAuthorize`; two roles: `ADMIN` (full access), `USER` (read + basic ops) |
| DTO boundary | Entities never exposed by controllers; DTOs never passed into repositories. See [ADR 0003](09-decisions/adr-0003-dto-boundary-no-entity-exposure.md) |
| Error shape | `{ "error": "<token>", "message": "...", "timestamp": "..." }` — one canonical shape; error token = `HttpStatus.name().toLowerCase()` (e.g. `bad_request`, `not_found`) |
| Link format | All cross-document links use `.md` extension (Pandoc rewrites at build time) |
