/**
 * @file ChartCard.test.tsx
 * @module __tests__/pages/analytics/components/ChartCard
 * @testing ChartCard, ChartPlaceholder
 * @description The card shows its title and exactly one of: the skeleton while
 *   loading, the empty message, or the chart inside a responsive box of the given height.
 */
import { describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import ChartCard, { ChartPlaceholder } from '@/pages/analytics/components/ChartCard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="responsive">{children}</div>,
}));

const chart = <div data-testid="chart" />;

describe('ChartCard', () => {
  it('shows the skeleton while loading', () => {
    const { container } = render(
      <ChartCard title="Title" loading empty={false} emptyText="none" skeletonHeight={123}>{chart}</ChartCard>,
    );
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).toHaveStyle({ height: '123px' });
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('shows the empty message in a box of the empty height', () => {
    render(<ChartCard title="Title" loading={false} empty emptyText="No data" emptyHeight={260}>{chart}</ChartCard>);
    expect(screen.getByText('No data')).toHaveStyle({ height: '260px' });
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('renders the chart in a responsive box and carries the test id', () => {
    render(
      <ChartCard title="Title" loading={false} empty={false} emptyText="none" height={300} testId="my-card">{chart}</ChartCard>,
    );
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
    expect(screen.getByTestId('responsive')).toContainElement(screen.getByTestId('chart'));
    expect(screen.getByTestId('responsive').parentElement).toHaveStyle({ height: '300px' });
  });

  it('defaults to 220 px placeholders and a 260 px chart', () => {
    const { container, rerender } = render(<ChartCard title="T" loading empty={false} emptyText="e">{chart}</ChartCard>);
    expect(container.querySelector('.MuiSkeleton-root')).toHaveStyle({ height: '220px' });
    rerender(<ChartCard title="T" loading={false} empty emptyText="e">{chart}</ChartCard>);
    expect(screen.getByText('e')).toHaveStyle({ height: '220px' });
    rerender(<ChartCard title="T" loading={false} empty={false} emptyText="e">{chart}</ChartCard>);
    expect(screen.getByTestId('responsive').parentElement).toHaveStyle({ height: '260px' });
  });
});

describe('ChartPlaceholder', () => {
  it('centres its text in a box of the given height', () => {
    render(<ChartPlaceholder height={120}>Pick an item</ChartPlaceholder>);
    expect(screen.getByText('Pick an item')).toHaveStyle({ height: '120px', display: 'grid' });
  });
});
