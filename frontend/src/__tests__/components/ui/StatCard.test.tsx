/**
 * @file StatCard.test.tsx
 * @module __tests__/components/ui/StatCard
 * @description Contract tests for the `StatCard` KPI component.
 *
 * Contract under test:
 * - Always renders the provided title.
 * - Renders a numeric value (including `0`) when not loading.
 * - Renders a placeholder ("—") for nullish values when not loading.
 * - When `loading` is true, hides the value and shows a loading placeholder.
 *
 * Out of scope:
 * - MUI styling/classes and layout details (variant/sx are implementation details).
 *
 * Test strategy:
 * - Assert user-observable output (text + testid) rather than MUI internals.
 * - Use table-driven cases for value/nullish rendering.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import StatCard from '@/components/ui/StatCard';
import type { StatCardProps } from '@/components/ui/StatCard';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function setup(overrides: Partial<StatCardProps> = {}) {
  const props: StatCardProps = {
    title: 'Test KPI',
    value: 100,
    ...overrides,
  };

  return render(<StatCard {...props} />);
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('StatCard', () => {
  it('renders the provided title', () => {
    setup({ title: 'Total Items' });
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });

  it.each([
    { name: 'number value', value: 42, expectedText: '42' },
    { name: 'zero value', value: 0, expectedText: '0' },
    { name: 'nullish value (null)', value: null, expectedText: '—' },
    { name: 'nullish value (undefined)', value: undefined, expectedText: '—' },
  ])('renders $name when not loading', ({ value, expectedText }) => {
    setup({ value, loading: false });
    expect(screen.getByTestId('stat-value')).toHaveTextContent(expectedText);
  });

  it('shows a skeleton and hides the value when loading is true', () => {
    const { container } = setup({ loading: true });

    // User-facing contract: value is not shown while loading.
    expect(screen.queryByTestId('stat-value')).not.toBeInTheDocument();

    // MUI Skeleton lacks a stable role/label here; class presence is a pragmatic smoke check.
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });
});
