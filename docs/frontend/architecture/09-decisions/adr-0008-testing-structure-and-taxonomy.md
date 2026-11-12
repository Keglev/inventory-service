# ADR-0008: Testing structure and taxonomy under src/__tests__

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-03-03

## Context
The frontend includes unit tests and UI/component tests across multiple architectural areas (app shell, menus, API utilities, i18n, routing behaviors).

Forces/constraints:
- **Clarity:** tests should be easy to find by architecture area.
- **Maintainability:** shared test utilities and stubs should not be duplicated.
- **Realism:** some tests require rendering with providers; others are pure unit tests.

## Decision
We keep tests under `frontend/src/__tests__/` and organize them with a clear taxonomy:

- `frontend/src/__tests__/unit/` for pure unit tests (utils, API helpers, i18n init)
- `frontend/src/__tests__/components/` for domain component and dialog tests (`components/pages/<domain>/*`) plus shared UI (`components/ui`, `components/hooks`, `components/help`)
- `frontend/src/__tests__/app/` for app-shell/layout tests (layout, HamburgerMenu, settings, footer, public shell)
- `frontend/src/__tests__/routes/` for router/guard behaviors (where applicable)
- `frontend/src/__tests__/features/` for cross-cutting features (help, auth, health) (where applicable)
- `frontend/src/__tests__/stubs/` for shared fixtures/stubs
- `frontend/src/__tests__/test/` for test harness:
  - provider wrappers (e.g., `all-providers.tsx`)
  - setup files
  - shared test utilities
- smaller focused areas: `frontend/src/__tests__/help/`, `hooks/`, `utils/`, `context/`

## Alternatives Considered
1. **Colocated tests next to source files**
   - Pros:
     - Tests near code
   - Cons:
     - Harder to discover “all tests for an architecture area”
     - Can clutter production folders

2. **Single flat tests folder**
   - Pros:
     - Simple
   - Cons:
     - Scales poorly; naming collisions

3. **Separate package for tests**
   - Pros:
     - Clean separation
   - Cons:
     - Adds complexity and build overhead

## Consequences
### Positive
- Architecture-aligned test organization.
- Shared harness and stubs are centralized.
- Easier onboarding and CI navigation.

### Negative / Tradeoffs
- Requires discipline to place tests in the correct subfolder.
- Some tests may span multiple layers; choose the folder by primary concern.

## Implementation Notes
- Where it is implemented (paths, key modules)
  - Root: `frontend/src/__tests__/`
  - Harness: `frontend/src/__tests__/test/all-providers.tsx`, `setupTests.ts`

- Migration notes (if relevant)
  - When moving tests, keep imports stable via shared test utilities.

- Testing implications (what should be tested and where)
  - Keep unit tests deterministic and fast.
  - Prefer rendering tests with the shared provider harness.

## Amendment 2026-11-12: the test tree mirrors the source tree
The taxonomy above (`unit/`, `components/pages/<domain>/`, the HamburgerMenu folder)
no longer describes the tree. Ruled by Carlos and carried out by the test-tree
moves of October 2026:

- `frontend/src/__tests__/` mirrors `frontend/src/`: the spec for
  `src/<path>/X.tsx` is `src/__tests__/<path>/X.test.tsx`. A reader finds the tests
  of a file by its path, and a moved source file shows which spec moves with it.
- `src/__tests__/stubs/` and `src/__tests__/test/` hold test-only infrastructure
  (stubs, the provider harness `test/all-providers.tsx`, the query-client helpers in
  `test/queryClient.tsx`). Contract and wiring specs that test no single source file
  live in the folder of the area they guard (the chart standards under `utils/`).
- Every test import and `vi.mock` path uses the `@/` alias, so a move changes no
  import.

The "Testing implications" lines of ADR-0001 to ADR-0007 that name `unit/` or
`components/pages/` paths follow this layout too.

## References
- Architecture docs: [Testing Concepts (§8c)](../08c-concepts-testing.md)
- Related ADRs: ADR-0006
