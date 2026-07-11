/**
 * @file example.test.tsx
 * @module tests/unit/example
 * @description Contract tests for test harness (render utilities).
 *
 * Contract under test:
 * - Guarantees the unit-test harness is correctly wired: React rendering
 *   utilities work and custom matchers (e.g., `toBeInTheDocument`) are
 *   available.
 *
 * Out of scope:
 * - Styling and layout correctness (CSS, responsive behavior, and visual
 *   regressions).
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
