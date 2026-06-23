# ADR-0003: DTO boundary — no entity exposure across layers

## Status
Accepted

## Date
2025-06-01

## Context
SmartSupplyPro follows a layered architecture: controllers receive HTTP requests,
services apply business logic, repositories persist and retrieve JPA entities.
A key design question is which objects cross each layer boundary.

Forces/constraints:
- **Serialization safety**: JPA entities contain lazy-loaded associations. Exposing
  an entity in a controller response risks triggering lazy loads outside a
  transaction (`LazyInitializationException`) or serializing more data than intended.
- **API stability**: the public REST contract should be decoupled from the internal
  persistence model; a schema change should not force an API change.
- **Auditability**: `createdBy` and `createdAt` are audit fields that must never
  be copied from client input; `createdAt` is populated by JPA lifecycle callbacks
  (`@PrePersist` on `InventoryItem`/`StockHistory`, `@CreationTimestamp` on
  `Supplier`), with `createdBy` defaulted in `@PrePersist` and optionally
  pre-set by the service layer.
- **Testability**: services and controllers should be testable with simple DTO
  objects, not full JPA entities wired to a database session.

## Decision
Entities never cross the controller boundary; DTOs never enter the repository layer.

- **Controllers** receive and return DTOs exclusively. All deserialization (`@RequestBody`)
  targets DTO classes; all serialized responses are DTOs.
- **Service layer** is the only place that crosses the boundary: it calls mapper
  classes to translate incoming DTOs to entities (before `save()`) and to translate
  outgoing entities to DTOs (before returning to the controller).
- **Repositories** never accept DTOs as parameters — every repository method parameter is a scalar or an entity id. CRUD methods accept and return JPA entities. Read-only reporting queries are the sole exception and may return DTO projections, produced one of two ways: (a) a JPQL constructor expression in a Spring Data @Query (e.g. StockHistoryRepository.getPriceTrend() returns List<PriceTrendDTO>), or (b) a custom repository implementation that maps result rows to a DTO in Java (e.g. StockTrendAnalyticsRepository.getItemPriceTrend() returns List<PriceTrendDTO>, StockDetailQueryRepository.streamEventsForWAC() returns List<StockEventRowDTO>). Most analytics methods return raw List<Object[]> tuples that the service layer maps to DTOs; only these two return DTOs directly. A DTO never enters a repository as a parameter.

## Alternatives Considered

1. **Expose entities directly from controllers**
   - Pros:
     - Less code — no mapper or DTO classes needed
   - Cons:
     - Lazy-loaded associations cause `LazyInitializationException` or require
       `FetchType.EAGER` everywhere (N+1 risk)
     - Jackson serializes the entire entity graph, including internal audit fields
       not intended for API consumers
     - Schema changes break the public API immediately

2. **Use DTOs in repositories (pass DTOs to `save()`)**
   - Pros:
     - Service layer needs no mapping step for writes
   - Cons:
     - Spring Data JPA's `save()` requires a managed entity; DTOs are not managed
       objects — this pattern requires manual `EntityManager` wiring
     - Repository tests would need DTO objects instead of entities, coupling
       persistence tests to API shape

3. **Use projections (Spring Data interface projections)**
   - Pros:
     - Avoids a separate DTO class for read-only queries
   - Cons:
     - Projection interfaces are harder to test and construct in unit tests
     - Does not help with write paths — entities are still required for `save()`
     - The codebase already has 14 DTO classes; projections would add a third
       abstraction alongside entities and DTOs

## Consequences

### Positive
- Controllers and their tests work with plain DTO objects; no Spring context or
  database session is required to unit-test a controller.
- The REST API shape is independent of the persistence schema; internal fields
  (`@CreationTimestamp`, JPA annotations) are never serialized.
- No accidental lazy-load triggers: the mapper is called inside the service
  transaction, where the session is still open.

### Negative / Tradeoffs
- Every new entity requires a corresponding DTO class and mapper method. For a
  codebase with 14 DTOs this is manageable but not zero cost.
- Read-only analytics queries return aggregated values as DTOs; these are
  constructed inside repository reporting queries (JPQL constructor expressions,
  and native SQL for aggregates), not mapped from entities — which is
  a pragmatic exception to the general pattern.

## Implementation Notes
- Where it is implemented:
  - DTOs: `src/main/java/com/smartsupplypro/inventory/dto/` (14 classes: e.g.,
    `InventoryItemDTO`, `SupplierDTO`, `StockHistoryDTO`, analytics DTOs)
  - Mappers: `src/main/java/com/smartsupplypro/inventory/mapper/` —
    `InventoryItemMapper`, `StockHistoryMapper`, `SupplierMapper`
  - Service layer: mappers are injected and called before `save()` and before
    returning from service methods
  - Repositories: `SupplierRepository`, `InventoryItemRepository`,
    `StockHistoryRepository`, `AppUserRepository` — no method takes a DTO
    parameter; CRUD methods use entity types, while reporting methods (e.g.
    `StockHistoryRepository.getPriceTrend()`) return DTO projections built by
    the query
  - Analytics/reporting repositories with custom implementations: StockDetailQueryRepository, StockMetricsRepository, StockTrendAnalyticsRepository (each with a *Impl), plus the static StockMetricsSqlBuilder. These run dialect-specific SQL (H2 in tests, Oracle in prod) selected via DatabaseDialectDetector — see ADR-0006.

- Migration notes (if relevant):
  - Analytics aggregation DTOs (`DashboardSummaryDTO`, `StockPerSupplierDTO`, etc.)
    are constructed inside repository reporting queries (JPQL constructor
    expressions or native SQL), not mapped from entity objects; they are
    an accepted exception consistent with this ADR (they still never enter the
    repository as parameters)

- Testing implications:
  - Controller tests use DTO objects and mock the service layer
  - Service tests use entity objects and mock the repository layer
  - The mapper classes are unit-tested independently

## References
- [§5 Building Block View](../05-building-blocks.md) — layer narrative describing
  the controller/service/repository boundary
- [ADR-0002: Manual mapping](./adr-0002-manual-mapping-over-mapstruct.md) — how
  the boundary is bridged
