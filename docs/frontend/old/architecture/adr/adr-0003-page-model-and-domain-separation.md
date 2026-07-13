# ADR-0003: Page model and domain separation (Inventory/Suppliers/Analytics)

## Status
Accepted

## Date
2026-03-03

## Context
Core screens are domain-heavy and include:
- tables and filters
- dialogs (create/edit/delete)
- handler logic and orchestration
- validation boundaries

Forces/constraints:
- **Maintainability:** domain UI should not sprawl into shared folders.
- **Consistency:** similar domains should share a recognisable internal structure.
- **Testability:** pages should be orchestrators; logic should be in hooks/handlers.

## Decision
We keep domain UI under `frontend/src/pages/<domain>/` and enforce a consistent internal structure:

- `components/`: presentational building blocks for the page
- `hooks/`: state and data composition hooks
- `handlers/`: event handlers and orchestration helpers
- `dialogs/`: dialog workflows
- `validation/`: Zod schemas/guards and domain validation concerns

Examples:
- `frontend/src/pages/inventory/*`
- `frontend/src/pages/suppliers/*`
- `frontend/src/pages/analytics/*`

## Alternatives Considered
1. **Flat pages** (everything in one file per page)
   - Pros:
     - Quick to start
   - Cons:
     - Becomes unmaintainable quickly
     - Harder to test and reuse logic

2. **Centralized components-by-type** (all dialogs in a shared dialogs folder)
   - Pros:
     - One place for all dialogs
   - Cons:
     - Domain ownership is lost
     - Increases coupling and naming collisions

3. **Feature folder per workflow** (e.g. inventory-edit/, inventory-delete/)
   - Pros:
     - Clear workflow boundaries
   - Cons:
     - Fragmentation and duplicated infrastructure across workflows

## Consequences
### Positive
- Domain ownership stays clear.
- Shared patterns become repeatable and documented.
- Orchestrator pages remain readable.

### Negative / Tradeoffs
- Some cross-domain duplication (e.g., table patterns) must be managed intentionally.
- Requires maintenance of internal conventions (folder names).

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Inventory orchestrator: `frontend/src/pages/inventory/InventoryBoard.tsx`
  - Suppliers orchestrator: `frontend/src/pages/suppliers/SuppliersBoard.tsx`
  - Analytics page: `frontend/src/pages/analytics/Analytics.tsx`

- Migration notes (if relevant)
  - When adding a new domain, start by copying the structure and adapting.

- Testing implications (what should be tested and where)
  - Page orchestrators: integration-ish tests under `frontend/src/__tests__/app/pages/*` (if present) or app-level tests.
  - Hooks/handlers: unit tests where feasible.

## References
- Architecture docs: [Domains](../domains/index.md)
- Diagram: [Domains overview](../diagrams/domains/domains-overview.md)
- Related ADRs: ADR-0004
