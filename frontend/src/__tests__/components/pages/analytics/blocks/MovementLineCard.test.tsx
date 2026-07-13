/**
 * @file MovementLineCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/MovementLineCard
 * @description Monthly stock-movement line chart (Stock In vs Stock Out).
 *
 * Contract under test:
 * - Loading state (skeleton), empty state, and chart rendering with data.
 * - Query parameter contract (from/to/supplierId normalization to undefined).
 * - Axis/tooltip formatter callbacks format via user preferences and fall
 *   back to the raw string when date formatting fails.
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { MonthlyMovement } from '../../../../../api/analytics/types';
import { getMonthlyStockMovement } from '../../../../../api/analytics/stock';
import MovementLineCard from '../../../../../pages/analytics/blocks/MovementLineCard';

// -----------------------------------------------------------------------------
// Captures: chart data plus the formatter props, so the card's own callbacks
// can be exercised (the inert recharts stubs would otherwise leave them dead).
// -----------------------------------------------------------------------------

let lastLineChartData: MonthlyMovement[] | null = null;
let lastXTickFormatter: ((v: string | number) => string) | null = null;
let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: string) => string) | null = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { dateFormat: 'DD/MM/YYYY', numberFormat: 'DE' },
  }),
}));

vi.mock('../../../../../api/analytics/stock', () => ({
  getMonthlyStockMovement: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: MonthlyMovement[] }) => {
    lastLineChartData = Array.isArray(data) ? [...data] : [];
    return <div data-testid="line-chart">{children}</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastXTickFormatter = tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  },
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastYTickFormatter = tickFormatter ?? null;
    return <div data-testid="y-axis" />;
  },
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter?: (v: number | string) => string;
    labelFormatter?: (v: string) => string;
  }) => {
    lastTooltipFormatter = formatter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Legend: () => <div data-testid="legend" />,
  Line: ({ name }: { name?: string }) => <div data-testid="line" data-name={name} />,
}));

const getMonthlyStockMovementMock = vi.mocked(getMonthlyStockMovement);

const sample: MonthlyMovement[] = [
  { month: '2026-05', stockIn: 12, stockOut: 4 },
  { month: '2026-06', stockIn: 7, stockOut: 9 },
] as MonthlyMovement[];

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function setup(props: Partial<React.ComponentProps<typeof MovementLineCard>> = {}) {
  return render(
    <QueryClientProvider client={createClient()}>
      <MovementLineCard {...props} />
    </QueryClientProvider>
  );
}

describe('MovementLineCard', () => {
  beforeEach(() => {
    getMonthlyStockMovementMock.mockReset();
    lastLineChartData = null;
    lastXTickFormatter = null;
    lastYTickFormatter = null;
    lastTooltipFormatter = null;
    lastTooltipLabelFormatter = null;
  });

  it('shows a skeleton while loading', () => {
    getMonthlyStockMovementMock.mockReturnValue(new Promise(() => {}) as never);

    setup();

    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    expect(screen.getByText('analytics:cards.monthlyMovement')).toBeInTheDocument();
  });

  it('shows the empty state when the API returns no rows', async () => {
    getMonthlyStockMovementMock.mockResolvedValue([]);

    setup();

    await waitFor(() =>
      expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument()
    );
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders both series with the fetched data', async () => {
    getMonthlyStockMovementMock.mockResolvedValue(sample);

    setup({ from: '2026-05-01', to: '2026-06-30', supplierId: 'sup-1' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());

    expect(lastLineChartData).toEqual(sample);
    const lines = screen.getAllByTestId('line');
    expect(lines.map((l) => l.getAttribute('data-name'))).toEqual([
      'analytics:cards.stockIn',
      'analytics:cards.stockOut',
    ]);
    expect(getMonthlyStockMovementMock).toHaveBeenCalledWith({
      from: '2026-05-01',
      to: '2026-06-30',
      supplierId: 'sup-1',
    });
  });

  it('normalizes a null supplierId to undefined in the fetch params', async () => {
    getMonthlyStockMovementMock.mockResolvedValue(sample);

    setup({ supplierId: null });

    await waitFor(() => expect(getMonthlyStockMovementMock).toHaveBeenCalled());
    expect(getMonthlyStockMovementMock).toHaveBeenCalledWith({
      from: undefined,
      to: undefined,
      supplierId: undefined,
    });
  });

  it('formats axis ticks and tooltip values via user preferences', async () => {
    getMonthlyStockMovementMock.mockResolvedValue(sample);

    setup();
    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());

    // Y ticks and tooltip numbers use the de-DE number format.
    expect(lastYTickFormatter?.(1234)).toBe('1.234');
    expect(lastTooltipFormatter?.(1234)).toBe('1.234 analytics:units.pieces');
    // Non-numeric tooltip values pass through untouched.
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
    // Date labels fall back to the raw string when not parseable as a date.
    expect(lastXTickFormatter?.('2026-05')).toBeTruthy();
    expect(lastTooltipLabelFormatter?.('2026-05')).toBeTruthy();
  });
});
