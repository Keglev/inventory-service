/**
 * @file RecentStockActivityCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/RecentStockActivityCard
 * @description
 * Enterprise tests for RecentStockActivityCard:
 * - Loading state (skeleton)
 * - Empty state when no updates exist
 * - API query parameters (from/to/supplierId/limit)
 * - Chart renders expected stacked series keys when updates exist
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockUpdateRow } from '@/api/analytics/updates';
import { getStockUpdates } from '@/api/analytics/updates';
import RecentStockActivityCard from '@/pages/analytics/blocks/RecentStockActivityCard';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('@/utils/formatters', async () => {
  const actual = await vi.importActual<typeof import('@/utils/formatters')>('@/utils/formatters');
  return {
    ...actual,
    formatDate: vi.fn(() => '2025-01-01'),
    formatNumber: vi.fn((value: number) => String(value)),
  };
});

vi.mock('@/api/analytics/updates', () => ({
  getStockUpdates: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Bar: ({ dataKey, name }: { dataKey: string; name?: string }) => (
    <div data-testid="bar-series" data-key={dataKey} data-name={name} />
  ),
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
  props: Partial<React.ComponentProps<typeof RecentStockActivityCard>> = {},
) {
  return render(
    <QueryClientProvider client={client}>
      <RecentStockActivityCard {...props} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('RecentStockActivityCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders a loading skeleton while fetching', () => {
    vi.mocked(getStockUpdates).mockReturnValue(new Promise(() => {}) as Promise<StockUpdateRow[]>);

    const { container } = setup(queryClient, { supplierId: 'sup-1' });

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows empty state when no updates are found', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([]);

    setup(queryClient, { supplierId: 'sup-1' });

    await waitFor(() => {
      expect(screen.getByText('No updates in this period.')).toBeInTheDocument();
    });
  });

  it('requests updates and renders stacked series when data exists', async () => {
    const updates: StockUpdateRow[] = [
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'Widget A', reason: 'Sale order', delta: -5 },
      { timestamp: '2025-01-01T13:00:00Z', itemName: 'Widget A', reason: 'Return', delta: 3 },
      { timestamp: '2025-01-02T09:00:00Z', itemName: 'Widget B', reason: 'Write off damage', delta: -2 },
    ];

    vi.mocked(getStockUpdates).mockResolvedValue(updates);

    setup(queryClient, { supplierId: 'sup-2', from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(getStockUpdates).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-2',
        limit: 200,
      });
    });

    await waitFor(() => {
      // The component aggregates to 2 daily buckets in this dataset.
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });

    const bars = screen.getAllByTestId('bar-series');
    const seriesKeys = bars.map((el) => el.getAttribute('data-key'));

    // We validate the contract: expected series exist (stacked by reason category).
    expect(seriesKeys).toEqual(expect.arrayContaining(['sale', 'return', 'writeOff']));
  });
});
