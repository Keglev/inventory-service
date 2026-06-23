# ADR-0006: Custom repository implementations for dialect-aware analytics queries

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2025-06-01

## Context
Beyond CRUD, SmartSupplyPro must answer analytical questions: total stock per
supplier, update counts per item, items below minimum stock, monthly stock
movement, daily valuation, weighted-average-cost (WAC) event streams, and item
price trends. These require aggregation and date bucketing that Spring Data derived
queries cannot express.

A second constraint shapes the solution: the application runs against **two SQL
dialects** — H2 (Oracle-compatibility mode) in the `test` profile, and Oracle
Autonomous Database in `prod`. The reason H2 is used in tests rather than a shared
Oracle instance is infrastructure: Oracle Free Tier ADB restricts access by IP
allowlist, and development machines (home ISP) and CI runners have dynamic IPs that
cannot be reliably added to that allowlist. Automated tests therefore run against H2
in Oracle-compatibility mode; Oracle is exercised only by the deployed application.
Several of these analytical statements differ between H2 and Oracle (date functions,
aggregation, valuation arithmetic), so a single fixed query string cannot serve both
environments.

Forces/constraints:
- **Expressiveness**: the queries need grouping, date bucketing, and conditional
  aggregation beyond derived-query or simple JPQL capability.
- **Dialect portability**: the same logical query must execute on H2 in CI and on
  Oracle in production without a live Oracle instance in the test pipeline.
- **One enforcement point for SQL**: dialect variants should live together, not be
  scattered across annotations, so they stay in sync.
- **Boundary consistency**: these queries must not violate the DTO boundary
  (see ADR-0003) — no DTO as a parameter; most results stay as tuples mapped by the
  service layer.

## Decision
Implement the analytical queries as **custom Spring Data repository fragments**
(`StockDetailQueryRepository`, `StockMetricsRepository`,
`StockTrendAnalyticsRepository`, each with a `*Impl`), rather than as derived queries
or `@Query` annotations.

- SQL text is centralised in a static, non-instantiable `StockMetricsSqlBuilder`
  exposing paired `buildH2*Sql()` / `buildOracle*Sql()` methods.
- Each `*Impl` selects the H2 or Oracle variant via an injected
  `DatabaseDialectDetector`. The detector inspects `Environment.getActiveProfiles()`
  only: if any active profile name equals `"test"` or `"h2"` (case-insensitive) it
  returns `true` for H2; any other case — including no active profile — defaults to
  Oracle. It does not inspect the datasource URL, connection metadata, or JDBC product
  name.
- Methods return raw `List<Object[]>` tuples, which the service layer maps to the
  analytics DTOs. Two methods are the exception and return a typed projection
  directly: `StockDetailQueryRepository.streamEventsForWAC()` → `List<StockEventRowDTO>`
  and `StockTrendAnalyticsRepository.getItemPriceTrend()` → `List<PriceTrendDTO>`.

## Alternatives Considered

1. **`@Query(nativeQuery = true)` with a single fixed string**
   - Pros: declarative, lives on the method
   - Cons: one string cannot branch per dialect; forces a lowest-common-denominator
     SQL that works on both, or breaks on one. No place for the H2/Oracle divergence
     these queries actually have.

2. **JPQL `@Query` / constructor expressions**
   - Pros: portable, type-safe projections
   - Cons: cannot express the dialect-specific aggregation and date bucketing;
     limited function support; no runtime dialect control.

3. **Database views (one per analytical question)**
   - Pros: moves heavy SQL into the database
   - Cons: requires keeping the H2 test schema and the Oracle prod schema's views in
     lockstep; not portable across the two engines; harder to version with the app.

4. **Separate query beans selected by Spring profile**
   - Pros: clean per-environment separation
   - Cons: duplicates the method surface and adds wiring; the dialect choice is a
     runtime detail, not a profile-wide one, so profile selection is the wrong axis.

## Consequences

### Positive
- The same analytics API runs on H2 in CI (no live Oracle needed) and on Oracle in
  production; the dialect difference is absorbed in one place.
- All SQL variants sit side by side in `StockMetricsSqlBuilder`, so an H2/Oracle pair
  is easy to compare and keep in sync.
- The DTO boundary holds: no DTO parameters; the service layer owns most DTO mapping,
  keeping repositories thin (consistent with ADR-0003).

### Negative / Tradeoffs
- Hand-written SQL has no compile-time checking; each query carries two variants to
  maintain.
- `List<Object[]>` returns are untyped; correctness of the tuple→DTO mapping rests on
  service-layer tests.
- Tests must exercise both dialect branches to catch divergence between the H2 and
  Oracle variants — H2-only testing can mask an Oracle-specific defect.

## Implementation Notes
- Where it is implemented:
  - `StockDetailQueryRepository` / `...Impl` — `searchStockUpdates(...)`
    (`List<Object[]>`) and `streamEventsForWAC(...)` (`List<StockEventRowDTO>`)
  - `StockMetricsRepository` / `...Impl` — `getTotalStockBySupplier()`,
    `getUpdateCountByItem(...)`, `findItemsBelowMinimumStock(...)`, all `List<Object[]>`
  - `StockTrendAnalyticsRepository` / `...Impl` — `getMonthlyStockMovement(...)`,
    `getMonthlyStockMovementBySupplier(...)`, `getDailyStockValuation(...)` (all
    `List<Object[]>`) and `getItemPriceTrend(...)` (`List<PriceTrendDTO>`)
  - `StockMetricsSqlBuilder` — static `buildH2*Sql()` / `buildOracle*Sql()` pairs;
    private constructor, non-instantiable
  - Each `*Impl` is constructor-injected with `DatabaseDialectDetector`, which reads
    `Environment.getActiveProfiles()`: a profile named `"test"` or `"h2"`
    (case-insensitive) selects H2; any other case (including no active profile) selects
    Oracle. The datasource URL, connection metadata, and JDBC product name are never
    consulted.

- Testing implications:
  - CI runs the H2 branch; the Oracle branch is exercised only against the prod
    database. Both SQL variants of a query should be kept under test where feasible.

## References
- [ADR-0003: DTO boundary](./adr-0003-dto-boundary-no-entity-exposure.md) — the
  reporting exception these repositories implement
- [§6 Runtime View](../06-runtime.md) — the analytics request flow
- [§8 Concepts](../08-concepts.md) — test strategy (H2 vs Oracle), once written
