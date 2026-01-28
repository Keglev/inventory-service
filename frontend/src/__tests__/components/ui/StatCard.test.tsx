/**
 * @file StatCard.test.tsx
 * @module __tests__/components/ui/StatCard
 * @description
 * Enterprise test suite for StatCard.
 *
 * Contract:
 * - Always renders the title.
 * - Renders a numeric value (including 0) or a placeholder ("—") for nullish values.
 * - When `loading` is true, shows a skeleton and hides the value.
 * - Uses outlined Card styling and full-height layout for dashboard grid alignment.
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

  it('renders a numeric value (including 0) as-is', () => {
    const { rerender } = setup({ value: 42 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('42');

    rerender(<StatCard title="Test KPI" value={0} />);
    expect(screen.getByTestId('stat-value')).toHaveTextContent('0');
  });

  it('renders a placeholder dash for nullish values', () => {
    const { rerender } = setup({ value: null });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('—');

    rerender(<StatCard title="Test KPI" value={undefined} />);
    expect(screen.getByTestId('stat-value')).toHaveTextContent('—');
  });

  it('shows a skeleton and hides the value when loading is true', () => {
    const { container } = setup({ loading: true });

    // User-facing contract: value is not shown while loading.
    expect(screen.queryByTestId('stat-value')).not.toBeInTheDocument();

    // MUI Skeleton often lacks stable roles/labels; class presence is a pragmatic check.
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('shows the value when loading is false or undefined', () => {
    const { container, rerender } = setup({ loading: false, value: 123 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('123');
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(0);

    rerender(<StatCard title="Test KPI" value={456} />); // loading omitted → treated as not loading
    expect(screen.getByTestId('stat-value')).toHaveTextContent('456');
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBe(0);
  });

  it('uses outlined Card styling (dashboard visual consistency)', () => {
    const { container } = setup();

    // This is a style contract for a cohesive KPI grid appearance.
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeTruthy();
    expect(card).toHaveClass('MuiPaper-outlined');
  });

  it('renders with full height (layout contract for equal-sized KPI tiles)', () => {
    const { container } = setup();

    const card = container.querySelector('.MuiCardContent-root')?.parentElement;
    expect(card).toBeTruthy();
    expect(card as HTMLElement).toHaveStyle({ height: '100%' });
  });
});
