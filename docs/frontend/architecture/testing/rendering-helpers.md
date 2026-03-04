<a id="top"></a>

[⬅️ Back to Testing Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Rendering Helpers & Provider Setup

Most component tests should use the shared render helper so provider wiring stays consistent.

## Global test setup

Vitest loads:
- `frontend/src/__tests__/test/setupTests.ts`

It registers:
- `@testing-library/jest-dom` matchers
- a test-only patch to stub MUI icon imports

## `renderWithProviders()` / `render`

Preferred import:
- `frontend/src/__tests__/test/test-utils.tsx`

This module:
- defines `renderWithProviders(ui)`
- re-exports RTL utilities
- also exports `render` as an alias of `renderWithProviders`

### Provider composition

`AllProviders` currently wraps with:
- `QueryClientProvider` (fresh client per render; retries disabled; `gcTime: 0`)
- `MemoryRouter`

This matches the repo’s general testing goal: **isolation and determinism**.

### Minimal example

```tsx
import { render, screen } from '@/__tests__/test/test-utils';

test('renders text', () => {
  render(<div>Hello</div>);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

## When to add extra providers

Not every test needs every real provider. Use the smallest setup that matches the contract.

Examples already present in the repo:
- Some tests wrap a component in `ThemeProvider` + `createTheme()` when a component relies on MUI theme context.
- Route tests use `MemoryRouter initialEntries={[path]}` to render at a specific URL.

## React Query hook helpers

For hook/unit tests that only need React Query (not routing), use:
- `frontend/src/__tests__/unit/utils/reactQueryTestUtils.tsx` (`createReactQueryWrapper`)

---

[Back to top](#top)
