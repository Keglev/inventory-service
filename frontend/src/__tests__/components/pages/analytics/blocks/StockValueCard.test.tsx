/**
 * @file StockValueCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/StockValueCard
 * @description
 * Enterprise tests for StockValueCard:
 * - Loading state (skeleton)
 * - Empty state when API returns no data
 * - Renders chart when data exists
 * - Query parameter contract (from/to/supplierId normalization)
 * - Refetch behavior when filters change
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockValuePoint } from '@/api/analytics/stock';
import { getStockValueOverTime } from '@/api/analytics/stock';
import StockValueCard from '@/pages/analytics/blocks/StockValueCard';

// -----------------------------------------------------------------------------
// Recharts capture (lets us assert sort behavior without relying on DOM text).
// -----------------------------------------------------------------------------

let lastLineChartData: StockValuePoint[] | null = null;

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
  LineChart: ({ children, data }: { children?: ReactNode; data: StockValuePoint[] }) => {
    lastLineChartData = Array.isArray(data) ? [...data] : [];
    return <div data-testid="line-chart">{children}</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

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
    queryClient = createClient();
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

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });

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
