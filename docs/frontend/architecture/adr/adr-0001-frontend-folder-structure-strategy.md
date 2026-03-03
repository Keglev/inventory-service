# ADR-0001: Frontend folder structure strategy (App Shell + Pages + API + Cross-cutting)

## Status
Accepted

## Date
2026-03-03

## Context
The frontend has multiple cross-cutting concerns (auth bootstrap, settings, help, toast UX) and several domain-heavy screens (inventory, suppliers, analytics).

Forces/constraints:
- **Maintainability:** developers need a predictable place to put new domain UI vs shared infrastructure.
- **Testability:** providers/hooks/features should be testable without forcing every test to render the whole app.
- **Consistency:** shared patterns (data access, help, settings) must be implemented once and reused.
- **Avoiding coupling:** domain pages should not depend on low-level HTTP details or unrelated features.

## Decision
We adopt a **feature-first + layered** folder strategy:

- `frontend/src/app/*`: application shell, navigation, global chrome, settings UI surfaces.
- `frontend/src/pages/*`: domain pages (Inventory, Suppliers, Dashboard, Analytics, Auth, Home, System).
- `frontend/src/api/*`: backend-facing API layer (domain modules + hooks) behind a shared `httpClient`.
- `frontend/src/context/*`: global state providers (Auth/Settings/Toast/Help).
- `frontend/src/features/*`: cross-cutting reusable UX features (e.g., auth guard, help trigger, health polling).
- `frontend/src/hooks/*`, `frontend/src/utils/*`: shared hooks/utilities that are not tied to one domain.
- `frontend/src/i18n/*`, `frontend/src/theme/*`, `frontend/src/styles/*`: localization, theme factory, and minimal global CSS.

We intentionally keep these architecture boundaries **stable** and document them, rather than mirroring documentation 1:1 with source folders.

## Alternatives Considered
1. **Strict layer-only structure** (e.g., everything grouped by layer: components/, hooks/, services/)
   - Pros:
     - Clear technical layering
     - Easy to apply uniform rules
   - Cons:
     - Domain ownership becomes unclear
     - Domain-specific UI gets scattered across many folders

2. **Strict feature-only structure** (everything nested under `pages/<domain>`)
   - Pros:
     - Clear ownership per domain
     - Easy to delete/replace features
   - Cons:
     - Cross-cutting concerns (auth/settings/help) get duplicated or entangled
     - Shared primitives become hard to discover and govern

3. **Monolithic “components/” approach** (large shared component library)
   - Pros:
     - Reuse is tempting and easy
   - Cons:
     - Encourages over-sharing and coupling
     - Hard to keep components generic

## Consequences
### Positive
- Predictable ownership: domain UI stays under `pages/*` and shared concerns live in dedicated places.
- Less accidental coupling: API + context + features remain reusable.
- Easier docs and onboarding: architecture topics map naturally onto these boundaries.

### Negative / Tradeoffs
- Requires discipline to avoid “misc dumping” into `utils/` or `components/`.
- Some concepts live in both places (e.g., “help” has `context/`, `features/`, and `help/` topic registry).

## Implementation Notes
- Where it is implemented (paths, key modules)
  - App shell: `frontend/src/app/layout/*`, `frontend/src/app/public-shell/*`
  - Routes: `frontend/src/routes/AppRouter.tsx`
  - API layer: `frontend/src/api/httpClient.ts`, `frontend/src/api/<domain>/*`
  - Providers: `frontend/src/context/auth/*`, `frontend/src/context/settings/*`, `frontend/src/context/help/*`, `frontend/src/context/toast/*`
  - Features: `frontend/src/features/auth/*`, `frontend/src/features/help/*`, `frontend/src/features/health/*`
  - i18n/theme/styles: `frontend/src/i18n/*`, `frontend/src/theme/*`, `frontend/src/styles/*`

- Migration notes (if relevant)
  - Prefer moving code into the correct boundary rather than adding new “misc” folders.

- Testing implications (what should be tested and where)
  - Tests mirror architecture boundaries under `frontend/src/__tests__/*`.

## References
- Architecture docs: [Domains](../domains/index.md), [Data Access](../data-access/index.md), [UI & UX Building Blocks](../ui/index.md)
- Diagram: [Frontend module map](../diagrams/system/module-map.md)
- Related ADRs: ADR-0002, ADR-0003, ADR-0006
