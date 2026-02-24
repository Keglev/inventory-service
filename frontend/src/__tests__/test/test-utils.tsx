/**
 * @file test-utils.tsx
 * @module __tests__/test/test-utils
 *
 * @description
 * React Testing Library helpers for this codebase.
 *
 * @responsibility
 * - Provide a single import surface for RTL utilities.
 * - Ensure all renders include the project’s required providers.
 *
 * @out_of_scope
 * - Component-specific test helpers (keep those near the component).
 * - Domain fixtures (belongs in fixtures/ or factories/).
 */

import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AllProviders } from './all-providers';

/**
 * Render helper that wraps the UI under test with the project test providers.
 *
 * Use this instead of `@testing-library/react`'s `render` to ensure consistent
 * provider setup across all tests.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/__tests__/test/test-utils';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Re-export RTL utilities so tests can import everything from one place.
 *
 * Note: `react-refresh/only-export-components` can complain about re-exports in
 * some setups; we intentionally allow it for this test entry point.
 */
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

/**
 * Convenience export: allow `import { render } from ...` in tests.
 * (Backed by `renderWithProviders`.)
 */
export { renderWithProviders as render };