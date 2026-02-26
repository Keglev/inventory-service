/**
 * @file example.test.tsx
 * @module tests/unit/example
 * @what_is_under_test test harness (render utilities)
 * @responsibility
 * Guarantees the unit-test harness is correctly wired: React rendering utilities work and
 * custom matchers (e.g., `toBeInTheDocument`) are available.
 * @out_of_scope
 * Application UI behavior (routes, context providers, and real components).
 * @out_of_scope
 * Styling and layout correctness (CSS, responsive behavior, and visual regressions).
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '../test/test-utils';

function TestComponent() {
  return <div>Hello Test</div>;
}

describe('test harness', () => {
  it('renders a component and exposes DOM queries', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('exposes vitest matchers', () => {
    expect(true).toBe(true);
  });
});
