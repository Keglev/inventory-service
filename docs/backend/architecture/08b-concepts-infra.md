# §8 Cross-cutting Concepts — Infrastructure

← [Runtime cross-cutting — Security, Validation, Exception Handling](08-concepts.md)

---

## Configuration / Profiles

`application.yml` holds shared defaults (server port 8081, OAuth2 provider URLs,
global logging). Two profile overlays specialise it:

| Profile | Activation | Database | SQL logging |
|---|---|---|---|
| (none) | No `SPRING_PROFILES_ACTIVE` | Oracle via `DB_URL` env var (H2 if unset) | DEBUG — JDBC + Hibernate SQL |
| `test` | `SPRING_PROFILES_ACTIVE=test` | H2 `MODE=Oracle` in-memory; `ddl-auto=create-drop` | DEBUG; H2 console at `/h2-console` |
| `prod` | `SPRING_PROFILES_ACTIVE=prod` | Oracle Autonomous DB via wallet; Flyway-managed schema, `ddl-auto=validate` | off (`show-sql=false`, root INFO) |

`AppProperties` (`@ConfigurationProperties(prefix="app")`) centralises all
environment-specific knobs: demo-readonly flag, frontend base URL and landing path,
CORS allowed origins, and OAuth2 state cookie settings. Every field defaults to a safe
local-dev value and is overridable by environment variable without code changes.

In production, HikariCP is tuned for Fly.io's RAM constraints: `maximum-pool-size=5`,
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
| `InventoryItem` | `@PrePersist` |
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

SLF4J with Logback (Spring Boot default). Log levels per profile:

| Profile | Application (`com.smartsupplypro`) | Framework / Hibernate SQL |
|---|---|---|
| default / test | DEBUG | DEBUG (JDBC + Hibernate SQL + parameter values) |
| prod | INFO | INFO (framework noise suppressed) |

In production: `show-sql=false`, health endpoint `show-details: never`. In test:
`show-details: always` to support CI assertions. Test output also writes to
`logs/test-application.log`. No MDC context or correlation ID is added to log entries.

---

See also: [§8 Testing (test strategy, H2 vs Oracle)](08c-concepts-testing.md)
