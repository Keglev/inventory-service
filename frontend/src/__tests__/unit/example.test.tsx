/**
 * Example test to verify test setup is working correctly
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';

// Simple component to test
function TestComponent() {
  return <div>Hello Test</div>;
}

describe('Test Setup', () => {
  it('should render a component', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('should have access to vitest globals', () => {
    expect(true).toBe(true);
  });
});
