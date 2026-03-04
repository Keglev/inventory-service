# ADR-0008: Testing structure and taxonomy under src/__tests__

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
- `frontend/src/__tests__/app/` for app-shell/layout/component tests
- `frontend/src/__tests__/routes/` for router/guard behaviors (where applicable)
- `frontend/src/__tests__/features/` for cross-cutting features (help, auth, health) (where applicable)
- `frontend/src/__tests__/stubs/` for shared fixtures/stubs
- `frontend/src/__tests__/test/` for test harness:
  - provider wrappers (e.g., `all-providers.tsx`)
  - setup files
  - shared test utilities

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

## References
- Architecture docs: [Testing](../testing/index.md)
- Related ADRs: ADR-0006
