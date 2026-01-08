/**
 * @file StatCard.test.tsx
 * @description
 * Test suite for StatCard component.
 * Verifies rendering, loading states, value display, and null/undefined handling.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '@/components/ui/StatCard';
import type { StatCardProps } from '@/components/ui/StatCard';

describe('StatCard', () => {
  // Helper function to render StatCard with props
  const renderStatCard = (props: Partial<StatCardProps> = {}) => {
    const defaultProps: StatCardProps = {
      title: 'Test KPI',
      value: 100,
      ...props,
    };
    return render(<StatCard {...defaultProps} />);
  };

  it('renders card with title', () => {
    // Verify that the component renders the provided title text
    renderStatCard({ title: 'Total Items' });
    expect(screen.getByText('Total Items')).toBeInTheDocument();
  });

  it('renders numeric value', () => {
    // Verify that numeric values are displayed correctly
    renderStatCard({ value: 42 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('42');
  });

  it('renders zero as valid value', () => {
    // Verify that zero is displayed (not treated as falsy/null)
    renderStatCard({ value: 0 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('0');
  });

  it('renders dash for null value', () => {
    // Verify that null values show fallback dash character
    renderStatCard({ value: null });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('—');
  });

  it('renders dash for undefined value', () => {
    // Verify that undefined values show fallback dash character
    renderStatCard({ value: undefined });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('—');
  });

  it('shows skeleton when loading is true', () => {
    // Verify that Skeleton component renders when loading state is true
    renderStatCard({ loading: true });
    expect(screen.queryByTestId('stat-value')).not.toBeInTheDocument();
    // Skeleton component renders variant="text"
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows value when loading is false', () => {
    // Verify that value displays when loading is explicitly false
    renderStatCard({ loading: false, value: 123 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('123');
    // Verify no skeleton is present
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBe(0);
  });

  it('shows value when loading is undefined', () => {
    // Verify that value displays when loading prop is not provided (defaults to falsy)
    renderStatCard({ value: 456 });
    expect(screen.getByTestId('stat-value')).toHaveTextContent('456');
  });

  it('renders outlined card variant', () => {
    // Verify that MUI Card uses outlined variant (applies MuiPaper-outlined class)
    renderStatCard();
    const card = document.querySelector('.MuiCard-root');
    expect(card).toHaveClass('MuiPaper-outlined');
  });

  it('renders with full height', () => {
    // Verify that card has height: 100% for layout flexibility
    renderStatCard();
    const card = document.querySelector('.MuiCardContent-root')?.parentElement;
    expect(card).toHaveStyle({ height: '100%' });
  });
});
