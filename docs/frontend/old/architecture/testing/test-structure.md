<a id="top"></a>

[⬅️ Back to Testing Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Test Structure & Naming Conventions

This page answers: **Where do I put tests and why?**

## High-level tree (actual)

Tests live under `frontend/src/__tests__/`:

- `app/` — app-shell and app-level UI orchestration tests (layout, menus, settings, public shell)
- `components/` — component-level tests for UI building blocks and page components
- `context/` — context modules and provider-level contracts
- `features/` — cross-cutting features (auth/help/health)
- `routes/` — routing contract tests
- `hooks/` — reusable hooks (debounce, context hooks, etc.)
- `unit/` — unit tests for pure logic and contracts
- `test/` — test harness utilities (setup file, provider wrappers, RTL helpers)
- `stubs/` — test-only module stubs (DataGrid, locales, icons, CSS)

## What belongs in `unit/` vs `test/`

- `unit/` means: the test subject is **pure** or close to pure.
  - Example: formatting/parsing helpers, small API invariants.

- `test/` means: **test infrastructure**, not “integration tests”.
  - `setupTests.ts` registers global matchers and patches heavy imports.
  - `all-providers.tsx` defines the shared provider wrapper.
  - `test-utils.tsx` exports `renderWithProviders()` and re-exports RTL utilities.

## Mirroring source structure

General rule:
- Mirror the source structure when the primary intent is “tests for this module family”.
  - Examples: `app/`, `routes/`, `features/`, `context/`, `hooks/`.

Exceptions:
- `unit/` is allowed to group by “pure concerns” even if source lives elsewhere.
- `stubs/` groups test-only replacements regardless of source layout.

## Naming conventions

File extensions:
- `*.test.ts` — unit tests for utilities, hooks without JSX
- `*.test.tsx` — component tests and anything with JSX

Qualifiers:
- Use dot qualifiers to make intent explicit when a module has multiple behaviors.
  - Example pattern already used in the repo: `Component.variant.test.tsx`

Contract vs integration-ish naming:
- Prefer making the *contract* explicit in the file header and test names.
- If needed, add a qualifier like `.contract.test.tsx` or `.workflow.test.tsx`.

---

[Back to top](#top)
