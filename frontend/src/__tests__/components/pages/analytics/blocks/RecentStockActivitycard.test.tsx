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
import { tEn } from '../../../../test/i18nEn';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
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
  Bar: ({ dataKey, name }: { dataKey: string; name?: string }) => (
    <div data-testid="bar-series" data-key={dataKey} data-name={name} />
  ),
}));

let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: string) => string) | null = null;

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

  it('normalizes edge-case reasons, skips bad timestamps, and formats values', async () => {
    const updates = [
      // Missing / invalid timestamps are skipped entirely.
      { itemName: 'A', delta: 5, reason: 'SOLD' },
      { itemName: 'B', timestamp: 'not-a-date', delta: 5, reason: 'SOLD' },
      // Reason-less rows and unknown reasons bucket into "other".
      { itemName: 'C', timestamp: '2025-02-01T10:00:00Z', delta: 2 },
      { itemName: 'D', timestamp: '2025-02-01T11:00:00Z', delta: 1, reason: 'SOMETHING_ELSE' },
      // Category keyword arms.
      { itemName: 'E', timestamp: '2025-02-01T12:00:00Z', delta: 3, reason: 'INITIAL_STOCK' },
      { itemName: 'F', timestamp: '2025-02-01T13:00:00Z', delta: -4, reason: 'MANUAL_UPDATE' },
      // Non-numeric delta degrades to 0 instead of crashing the sum.
      { itemName: 'G', timestamp: '2025-02-01T14:00:00Z', delta: 'x', reason: 'DAMAGED' },
    ] as unknown as StockUpdateRow[];
    vi.mocked(getStockUpdates).mockResolvedValue(updates);

    setup(queryClient, { from: '2025-02-01', to: '2025-02-28' });

    await waitFor(() => {
      // Rows with bad timestamps are dropped; the rest share one daily bucket.
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '1');
    });

    const seriesKeys = screen
      .getAllByTestId('bar-series')
      .map((el) => el.getAttribute('data-key'));
    expect(seriesKeys).toEqual(
      expect.arrayContaining(['other', 'initialStock', 'adjustment', 'writeOff']),
    );

    // Formatter callbacks: counts, tooltip pieces, and label passthrough.
    expect(lastYTickFormatter?.(1234)).toBe('1234');
    expect(lastTooltipFormatter?.(1234)).toBe('1234 pcs');
    expect(lastTooltipLabelFormatter?.('Feb 1')).toBe('Feb 1');
  });
});
