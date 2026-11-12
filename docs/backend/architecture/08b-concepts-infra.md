# §8 Cross-cutting Concepts — Infrastructure

← [Runtime cross-cutting — Security, Validation, Exception Handling](08-concepts.md)

---

## Configuration / Profiles

`application.yml` holds shared defaults (server port 8081, the Oracle datasource from the
environment, OAuth2 provider settings, the session cookie). Three profile overlays
specialise it, and a fourth lives with the tests:

| Profile | Activation | Database | SQL logging |
|---|---|---|---|
| (none) | No `SPRING_PROFILES_ACTIVE` | Oracle from `DB_URL`, `DB_USER`, `DB_PASS`; startup fails without them. Flyway off, `ddl-auto=none` | off |
| `test` | `SPRING_PROFILES_ACTIVE=test` (the Maven test run) | H2 `MODE=Oracle` in memory; `ddl-auto=create-drop` | off (`logback-test.xml`, root WARN); on demand `-Dlogging.level.org.hibernate.SQL=DEBUG` |
| `e2e` | added to `test` for the browser suite (`test,e2e`) | H2 as in `test`, loaded with `db/e2e/e2e-seed.sql`; demo mode on | as in `test` |
| `prod` | `SPRING_PROFILES_ACTIVE=prod` | Oracle Autonomous DB via the wallet; Flyway-managed schema, `ddl-auto=validate` | off |
| `oracle-it` | test-only (`src/test/resources/application-oracle-it.yml`), run by hand | a real Oracle ADB from a developer machine ([runbook](oracle-it-smoke-test.md)) | off |

`AppProperties` (`@ConfigurationProperties(prefix="app")`) centralises all
environment-specific knobs: demo-readonly flag, frontend base URL and landing path,
CORS allowed origins, and OAuth2 state cookie settings. Every field defaults to a safe
local-dev value and is overridable by environment variable without code changes.

In production, HikariCP is tuned for the container's 1400 MiB memory cap: `maximum-pool-size=5`,
`max-lifetime=240000` ms (below Oracle ADB's 5-minute idle timeout), with a
`SELECT 1 FROM DUAL` keepalive query.

---

## Persistence

All JPA entities carry exactly two audit fields — `createdBy` (plain `String`, the
authenticated user's email from `SecurityContext`, set in the service layer before
`save()`; not a foreign key to `AppUser`) and `createdAt` (`LocalDateTime`, set
immutably at creation):

| Entity | `createdAt` mechanism |
|---|---|
| `Supplier` | `@CreationTimestamp` |
| `InventoryItem` | Service, before the first `save()` (`InventoryItemValidationHelper.populateServerFields`) |
| `StockHistory` | `@PrePersist` |
| `AppUser` | Field initialiser |

There is no `updatedAt`, no `updatedBy`, and no `@Version` field on any entity.
`StockHistory` records are immutable by design and are never updated after insertion.

All `id` fields are UUID strings. `InventoryItem` and `Supplier` each hold a read-only
lazy `@ManyToOne` join for object navigation; the authoritative FK (`supplierId`) is a
plain `String` column on the owning entity, and `insertable=false, updatable=false`
prevents the join from conflicting with the scalar column.

**Schema evolution** is owned by Flyway: a baseline plus migrations V2–V5 (SKU column,
demo reseed, SKU constraints, ACTIVE flag). In production Hibernate only validates
mappings (`ddl-auto=validate`); applied migration files are immutable — checksums make
any edit to an applied file a startup failure, so data changes always ship as a new
migration.

**Soft delete** — `InventoryItem` rows are never physically deleted:

| Rule | Behaviour |
|---|---|
| Gate | Quantity must be zero; remaining stock is first removed through audited quantity adjustments, otherwise 409 |
| Delete | Sets `active=false` (Flyway V5) |
| Reads | Active-catalog reads filter on the flag; stock-history joins intentionally do NOT, preserving the audit trail |
| Storage | `NUMBER(1)` via `NumericBooleanConverter` — same mapping works on Oracle and on H2 in Oracle-compatibility mode |

See [§5 Repository Layer](05-building-blocks.md#repository-layer).

---

## Logging

SLF4J with Logback (Spring Boot default), plain text on standard output:

| Profile | Root level | SQL |
|---|---|---|
| (none) / `prod` | INFO (Boot's default) | not logged (`show-sql` keeps its default, false) |
| `test` / `e2e` | WARN (`src/test/resources/logback-test.xml`, console only) | not logged unless `-Dlogging.level.org.hibernate.SQL=DEBUG` is passed |

In production the health endpoint keeps `show-details: never` (Boot's default); the
`test` profile sets `always` for the assertions in CI. No MDC
context or correlation ID is added to log entries. What may be logged, and how request
text is kept from forging a line, is recorded in
[ADR-0021](09-decisions/adr-0021-request-text-neutralised-at-the-log-call.md).

---

See also: [§8 Testing (test strategy, H2 vs Oracle)](08c-concepts-testing.md)
