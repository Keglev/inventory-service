/**
 * @file ReasonBreakdownChartCard.test.tsx
 * @module __tests__/components/pages/analytics/sections/ReasonBreakdownChartCard
 * @description Presentational bar-chart card for stock-in / stock-out
 * reason breakdowns.
 *
 * Contract under test:
 * - Loading skeleton, empty state, and populated chart states.
 * - Axis and tooltip formatters format counts per user preference and
 *   pass non-numeric values through as strings.
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { dateFormat: 'DD.MM.YYYY', numberFormat: 'DE' },
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastYTickFormatter = tickFormatter ?? null;
    return <div data-testid="y-axis" />;
  },
  Tooltip: ({ formatter }: { formatter?: (v: number | string) => string }) => {
    lastTooltipFormatter = formatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Bar: () => <div data-testid="bar" />,
}));

import ReasonBreakdownChartCard from '../../../../../pages/analytics/sections/ReasonBreakdownChartCard';

const data = [
  { label: 'Sold', value: 1234 },
  { label: 'Damaged', value: 5 },
];

function setup(props: Partial<React.ComponentProps<typeof ReasonBreakdownChartCard>> = {}) {
  return render(
    <ReasonBreakdownChartCard
      title="Stock out"
      data={data}
      color="#123456"
      loading={false}
      {...props}
    />
  );
}

describe('ReasonBreakdownChartCard', () => {
  beforeEach(() => {
    lastYTickFormatter = null;
    lastTooltipFormatter = null;
  });

  it('shows a skeleton while the feeding query loads', () => {
    const { container } = setup({ loading: true });

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('shows the empty state when there is nothing to plot', () => {
    setup({ data: [] });

    expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument();
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('renders the titled chart with one row per reason', () => {
    setup();

    expect(screen.getByText('Stock out')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
  });

  it('formats axis and tooltip counts, passing strings through', () => {
    setup();

    expect(lastYTickFormatter?.(1234)).toBe('1.234');
    expect(lastYTickFormatter?.('raw')).toBe('raw');
    expect(lastTooltipFormatter?.(1234)).toBe('1.234 analytics:units.pieces');
    expect(lastTooltipFormatter?.('raw')).toBe('raw');
  });
});
