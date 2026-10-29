/**
 * @file StockValueCard.test.tsx
 * @module __tests__/pages/analytics/blocks/StockValueCard
 * @description
 * Enterprise tests for StockValueCard:
 * - Loading state (skeleton)
 * - Empty state when API returns no data
 * - Renders chart when data exists
 * - Query parameter contract (from/to/supplierId normalization)
 * - Step line without dots on a time axis over change points, the last value
 *   carried to the range end when a response stops short of it, a named series,
 *   and a theme-driven tooltip surface
 * - Refetch behavior when filters change
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/__tests__/test/queryClient';
import { createTheme } from '@mui/material/styles';

import type { StockValuePoint } from '@/api/analytics/stock';
import { getStockValueOverTime } from '@/api/analytics/stock';
import StockValueCard from '@/pages/analytics/blocks/StockValueCard';

// -----------------------------------------------------------------------------
// Recharts capture (lets us assert sort behavior without relying on DOM text).
// -----------------------------------------------------------------------------

type PlottedPoint = StockValuePoint & { t: number; carried?: boolean };
let lastLineChartData: PlottedPoint[] | null = null;
let lastXAxisProps: { type?: string; scale?: string; domain?: number[]; ticks?: number[] } | null = null;
let lastXTickFormatter: ((v: string | number) => string) | null = null;
let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastYDomain: unknown = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: number) => string) | null = null;
let lastTooltipProps: Record<string, unknown> | null = null;
let lastLineProps: Record<string, unknown> | null = null;

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('@/api/analytics/stock', () => ({
  getStockValueOverTime: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: PlottedPoint[] }) => {
    lastLineChartData = Array.isArray(data) ? [...data] : [];
    return <div data-testid="line-chart">{children}</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: (props: { type?: string; scale?: string; domain?: number[]; ticks?: number[]; tickFormatter?: (v: string | number) => string }) => {
    lastXAxisProps = props;
    lastXTickFormatter = props.tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  },
  YAxis: ({ tickFormatter, domain }: { tickFormatter?: (v: string | number) => string; domain?: unknown }) => {
    lastYTickFormatter = tickFormatter ?? null;
    lastYDomain = domain;
    return <div data-testid="y-axis" />;
  },
  Tooltip: (props: {
    formatter?: (v: number | string) => string;
    labelFormatter?: (v: number) => string;
  }) => {
    const { formatter, labelFormatter } = props;
    lastTooltipProps = props;
    lastTooltipFormatter = formatter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Line: (props: Record<string, unknown>) => {
    lastLineProps = props;
    return <div data-testid="line" />;
  },
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------


function setup(
  client: QueryClient,
  props: Partial<React.ComponentProps<typeof StockValueCard>> = {},
) {
  return render(
    <QueryClientProvider client={client}>
      <StockValueCard {...props} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('StockValueCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    lastLineChartData = null;
    lastXAxisProps = null;
    lastXTickFormatter = null;
    lastYTickFormatter = null;
    lastTooltipFormatter = null;
    lastTooltipLabelFormatter = null;
    lastTooltipProps = null;
    lastLineProps = null;
    queryClient = createTestQueryClient();
  });

  it('drops rows without a valid date and formats axis and tooltip values', async () => {
    const mockData = [
      { date: '2025-01-02', totalValue: 1100 },
      { totalValue: 900 },
      { date: '2025-01-01', totalValue: 1000 },
    ] as StockValuePoint[];
    vi.mocked(getStockValueOverTime).mockResolvedValue(mockData);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-02' });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    // A time axis cannot place a row without a date.
    expect(lastLineChartData?.map((p) => p.date)).toEqual(['2025-01-01', '2025-01-02']);
    // Y ticks show whole euros so five-digit values fit the axis; the tooltip keeps
    // two decimals, and strings pass through.
    expect(lastYTickFormatter?.(1234.5)).toBe('1,235');
    expect(lastTooltipFormatter?.(1234.5)).toBe('1,234.50 €');
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
    // Time-axis values arrive as epoch ms and format via preferences.
    expect(lastXTickFormatter?.(Date.parse('2025-01-01'))).toBe('01/01/2025');
    expect(lastTooltipLabelFormatter?.(Date.parse('2025-01-02'))).toBe('01/02/2025');
  });

  it('places the series on a time axis over the selected range', async () => {
    // The series starts after the range start: the days before stay empty, no 0 EUR point.
    vi.mocked(getStockValueOverTime).mockResolvedValue([{ date: '2025-01-10', totalValue: 1000 }]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastXAxisProps).toMatchObject({ type: 'number', scale: 'time' });
    expect(lastXAxisProps?.domain).toEqual([Date.parse('2025-01-01'), Date.parse('2025-01-31')]);
    expect(lastXAxisProps?.ticks?.[0]).toBe(Date.parse('2025-01-01'));
    expect(lastLineChartData?.[0]).toMatchObject({ date: '2025-01-10', totalValue: 1000 });
  });

  it('carries the last value to the range end when the response stops short of it', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-10', totalValue: 1200 },
    ]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastLineChartData?.at(-1)).toEqual({ date: '2025-01-31', totalValue: 1200, t: Date.parse('2025-01-31'), carried: true });
  });

  it('anchors the value axis at zero for a flat series and fits it to a changing one', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([{ date: '2025-01-10', totalValue: 250 }]);
    const view = setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastYDomain).toEqual([0, 'auto']);

    view.unmount();
    vi.mocked(getStockValueOverTime).mockResolvedValue([{ date: '2025-01-10', totalValue: 250 }, { date: '2025-01-20', totalValue: 260 }]);
    setup(createTestQueryClient(), { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(lastYDomain).toEqual(['auto', 'auto']));
  });

  it('adds nothing when the backend already sends the range end', async () => {
    // Change points as the backend sends them: first day, a change, the range end.
    vi.mocked(getStockValueOverTime).mockResolvedValue([
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-12', totalValue: 900 },
      { date: '2025-01-31', totalValue: 900 },
    ]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastLineChartData?.map((p) => [p.date, p.carried])).toEqual([
      ['2025-01-01', undefined],
      ['2025-01-12', undefined],
      ['2025-01-31', undefined],
    ]);
  });

  it('draws a named step line without point dots and a theme-coloured tooltip', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([{ date: '2025-01-01', totalValue: 1000 }]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });
    expect(lastLineProps).toMatchObject({ type: 'stepAfter', dot: false, name: 'analytics:cards.stockValueSeries' });
    // Rendered without a ThemeProvider, so the card sees MUI's default theme.
    const theme = createTheme();
    expect(lastTooltipProps).toMatchObject({
      contentStyle: { backgroundColor: theme.palette.background.paper },
      labelStyle: { color: theme.palette.text.primary },
    });
  });

  it('renders loading skeleton while the query is pending', () => {
    vi.mocked(getStockValueOverTime).mockReturnValue(
      new Promise(() => {}) as Promise<StockValuePoint[]>,
    );

    const { container } = setup(queryClient);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders chart when data exists', async () => {
    const mockData: StockValuePoint[] = [
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-02', totalValue: 1100 },
      { date: '2025-01-03', totalValue: 1200 },
    ];
    vi.mocked(getStockValueOverTime).mockResolvedValue(mockData);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data is available', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument();
    });
  });

  it('requests data with from/to and normalizes missing supplierId to undefined', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    setup(queryClient, { from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: undefined,
      });
    });
  });

  it('requests data with supplierId when provided', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    setup(queryClient, { from: '2025-01-01', to: '2025-12-31', supplierId: 'sup-123' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: 'sup-123',
      });
    });
  });

  it('normalizes null supplierId to undefined', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    setup(queryClient, { from: '2025-01-01', to: '2025-12-31', supplierId: null });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: undefined,
      });
    });
  });

  it('sorts chart data by date ascending before rendering', async () => {
    const unsorted: StockValuePoint[] = [
      { date: '2025-01-03', totalValue: 1200 },
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-02', totalValue: 1100 },
    ];
    vi.mocked(getStockValueOverTime).mockResolvedValue(unsorted);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-03' });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    expect(lastLineChartData?.map((p) => p.date)).toEqual([
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
    ]);
  });

  it('renders title', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    setup(queryClient);

    await waitFor(() => {
      expect(screen.getByText('analytics:cards.stockValue')).toBeInTheDocument();
    });
  });

  it('refetches when filter parameters change', async () => {
    vi.mocked(getStockValueOverTime).mockResolvedValue([]);

    const view = setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledTimes(1);
    });

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <StockValueCard from="2025-02-01" to="2025-02-28" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledTimes(2);
    });
  });
});
