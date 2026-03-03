# ADR-0004: Dialog/workflow architecture (Dialog folders + orchestration pattern)

## Status
Accepted

## Date
2026-03-03

## Context
Domains implement multiple CRUD-like workflows that require dialogs (create/edit/delete, and domain-specific actions like quantity/price adjustments).

Forces/constraints:
- **Consistency:** dialogs should feel and behave consistently across domains.
- **Maintainability:** each dialog should have a clear boundary for UI vs workflow logic.
- **Testability:** workflows should be testable without coupling to the entire page.

## Decision
We structure dialogs as **per-dialog folders** under each domain, while keeping orchestration logic in handlers/hooks:

- `frontend/src/pages/<domain>/dialogs/<DialogName>/*`
  - dialog UI components
  - dialog-local hooks and helpers

- orchestration responsibilities remain in:
  - `frontend/src/pages/<domain>/handlers/*` (event wiring)
  - and the page orchestrator (open/close dialog state, selected row)

Examples:
- `frontend/src/pages/inventory/dialogs/*`
- `frontend/src/pages/suppliers/dialogs/*`

## Alternatives Considered
1. **Single shared Dialog framework used everywhere**
   - Pros:
     - One UI contract
   - Cons:
     - Often too generic; domain differences leak anyway

2. **Inline dialogs inside the page file**
   - Pros:
     - Fast to implement
   - Cons:
     - Page becomes unreadable
     - Hard to test and reuse

3. **Central dialogs folder across app**
   - Pros:
     - One place to find dialogs
   - Cons:
     - Cross-domain coupling
     - Naming collisions and unclear ownership

## Consequences
### Positive
- Dialog ownership stays with the domain.
- Dialog UI stays cohesive (folder boundary).
- Orchestrator pages remain readable and predictable.

### Negative / Tradeoffs
- Some dialog patterns may be duplicated across domains until intentionally extracted.
- Requires keeping orchestration logic out of dialog components.

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Inventory dialogs: `frontend/src/pages/inventory/dialogs/*` (e.g., `DeleteItemDialog/`, `EditItemDialog/`, ...)
  - Suppliers dialogs: `frontend/src/pages/suppliers/dialogs/*`
  - Orchestration: `frontend/src/pages/inventory/handlers/*`, `frontend/src/pages/suppliers/handlers/*`

- Migration notes (if relevant)
  - If a dialog becomes shared across many domains, move it into `frontend/src/components/` or `frontend/src/features/` only after it is truly generic.

- Testing implications (what should be tested and where)
  - Dialog rendering and interaction: `frontend/src/__tests__/app/pages/<domain>/*` or dialog-specific tests.

## References
- Architecture docs: [Domains](../domains/index.md)
- Diagram: [Domains overview](../diagrams/domains/domains-overview.md)
- Related ADRs: ADR-0003
