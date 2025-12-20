/**
 * Custom render function for React Testing Library
 * Automatically wraps components with necessary providers
 */
import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AllProviders } from './all-providers';

/**
 * Custom render function that wraps components with AllProviders
 * Use this instead of the default render from @testing-library/react
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

// Re-export everything from @testing-library/react
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Override render with our custom version
export { renderWithProviders as render };
