# ADR-0002: Manual mapping over MapStruct

## Status
Accepted

## Date
2025-06-01

## Context
SmartSupplyPro's service layer must translate between JPA entities and DTOs in both
directions. The project uses 14 DTOs across inventory, supplier, stock history, and
analytics domains. Several mappings involve computed fields (e.g., `totalValue` =
`price × quantity` in `InventoryItemMapper`) or deliberate field exclusions (e.g.,
`createdBy` overwritten in the service layer after mapping).

Forces/constraints:
- **Explicitness**: computed and conditional mapping logic must be readable and
  debuggable without understanding a code-generation framework.
- **Control**: some fields (`createdBy`, `createdAt`) must be set by the service
  layer or `@PrePersist`, not blindly copied — a code generator that copies all
  fields by default is a liability.
- **Simplicity**: adding MapStruct requires an annotation processor, build-plugin
  configuration, and generated source inspection to verify correctness.
- **Portfolio readability**: reviewers reading the codebase should be able to trace
  data flow without knowing MapStruct's conventions.

## Decision
All entity-to-DTO and DTO-to-entity conversions are implemented as plain Spring
`@Component` mapper classes (`InventoryItemMapper`, `StockHistoryMapper`,
`SupplierMapper`) with explicit `toDTO()` and `toEntity()` methods. No code
generation framework is used.

## Alternatives Considered

1. **MapStruct**
   - Pros:
     - Eliminates boilerplate for field-by-field copies
     - Compile-time safety: unmapped fields produce warnings
     - Well-known in enterprise Java
   - Cons:
     - Requires annotation processor and Maven plugin; adds a build-time dependency
     - Custom logic (computed fields, conditional writes) requires `@AfterMapping`
       or expression callbacks — often harder to read than a plain method
     - Generated code is invisible in the IDE until the build runs; debugging
       requires inspecting `target/generated-sources/`
     - For the number of DTOs in this project (~14), the boilerplate saving is modest

2. **ModelMapper**
   - Pros:
     - Zero configuration for simple 1:1 field matches
   - Cons:
     - Reflection-based; mapping errors surface at runtime, not compile time
     - Type-unsafe; silently skips mismatched fields
     - Performance overhead from reflection on hot paths

3. **Records/constructors with Lombok `@Builder`**
   - Pros:
     - Less ceremony than full mapper classes
   - Cons:
     - Computed fields and null guards still require helper methods
     - Does not meaningfully differ from the chosen approach for this codebase

## Consequences

### Positive
- Every mapping is explicit: a reader can see exactly which fields are set and why.
- Computed fields (`totalValue`), null guards, and deliberate omissions are plain Java
  — no framework convention to look up.
- No annotation processor; the build has one fewer moving part.

### Negative / Tradeoffs
- Adding a new DTO field requires updating `toDTO()` and `toEntity()` manually;
  MapStruct would catch omissions at compile time.
- More lines of code per mapper compared to a generated equivalent.

## Implementation Notes
- Where it is implemented:
  - `src/main/java/com/smartsupplypro/inventory/mapper/InventoryItemMapper.java`
    — `toDTO()` computes `totalValue` and resolves `supplierName` from the lazy
    `@ManyToOne`; `toEntity()` does not copy the audit fields from the DTO —
    `createdAt` is set by the entity's `@PrePersist` callback, and `createdBy`
    falls back to `"system"` there if the service layer has not already assigned it
  - `src/main/java/com/smartsupplypro/inventory/mapper/StockHistoryMapper.java`
  - `src/main/java/com/smartsupplypro/inventory/mapper/SupplierMapper.java`
  - All three are `@Component`-injected; service classes receive them via
    constructor injection

- Migration notes (if relevant):
  - If a new entity is added, create a corresponding mapper class in the `mapper/`
    package following the same `toDTO()` / `toEntity()` pattern

- Testing implications:
  - Mappers can be unit-tested directly (no Spring context required) by
    constructing an entity, calling `toDTO()`, and asserting field values

## References
- [§5 Building Block View](../05-building-blocks.md) — service layer description
- [ADR-0003: DTO boundary](./adr-0003-dto-boundary-no-entity-exposure.md) — why
  the boundary exists that these mappers bridge
