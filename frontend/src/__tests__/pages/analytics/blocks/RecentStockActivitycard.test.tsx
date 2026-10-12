/**
 * @file RecentStockActivityCard.test.tsx
 * @module __tests__/pages/analytics/blocks/RecentStockActivityCard
 * @description
 * Enterprise tests for RecentStockActivityCard:
 * - Loading state (skeleton)
 * - Empty state when no updates exist
 * - API query parameters (from/to/supplierId)
 * - Signed bars stacked by sign on a time axis, daily or weekly
 * - Fixed colour per kind, legend and tooltip order, formatters
 * Grouping rules: stockActivitySeries.test.ts.
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockUpdateRow } from '@/api/analytics/updates';
import { getStockUpdates } from '@/api/analytics/updates';
import RecentStockActivityCard from '@/pages/analytics/blocks/RecentStockActivityCard';
import { tEn } from '@/__tests__/test/i18nEn';

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
  BarChart: ({ children, data, stackOffset }: { children?: ReactNode; data: unknown[]; stackOffset?: string }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0} data-stack-offset={stackOffset}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: (props: XAxisProps) => {
    lastXAxis = props;
    return <div data-testid="x-axis" />;
  },
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastYTickFormatter = tickFormatter ?? null;
    return <div data-testid="y-axis" />;
  },
  ReferenceLine: ({ y }: { y?: number }) => <div data-testid="reference-line" data-y={y} />,
  Tooltip: ({
    formatter,
    labelFormatter,
    itemSorter,
  }: {
    formatter?: (v: number | string) => string;
    labelFormatter?: (v: number) => string;
    itemSorter?: (item: { dataKey?: unknown }) => number;
  }) => {
    lastTooltipFormatter = formatter ?? null;
    lastTooltipSorter = itemSorter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Legend: ({ itemSorter }: { itemSorter?: (item: { dataKey?: unknown }) => number }) => {
    lastLegendSorter = itemSorter ?? null;
    return <div data-testid="legend" />;
  },
  Bar: ({ dataKey, name, fill, stackId }: { dataKey: string; name?: string; fill?: string; stackId?: string }) => (
    <div data-testid="bar-series" data-key={dataKey} data-name={name} data-fill={fill} data-stack={stackId} />
  ),
}));

type XAxisProps = { type?: string; scale?: string; domain?: number[]; ticks?: number[]; tickFormatter?: (v: number) => string };
let lastXAxis: XAxisProps | null = null;
let lastLegendSorter: ((item: { dataKey?: unknown }) => number) | null = null;
let lastTooltipSorter: ((item: { dataKey?: unknown }) => number) | null = null;
const tooltipOrderOf = (keys: string[]) =>
  [...keys].sort((a, b) => (lastTooltipSorter?.({ dataKey: a }) ?? 0) - (lastTooltipSorter?.({ dataKey: b }) ?? 0));
const legendOrderOf = (keys: string[]) =>
  [...keys].sort((a, b) => (lastLegendSorter?.({ dataKey: a }) ?? 0) - (lastLegendSorter?.({ dataKey: b }) ?? 0));
let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: number) => string) | null = null;

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

  it('requests the window and draws one signed series per kind, stacked by sign', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'Widget A', reason: 'SOLD', delta: -5 },
      { timestamp: '2025-01-01T13:00:00Z', itemName: 'Widget A', reason: 'RETURNED_BY_CUSTOMER', delta: 3 },
      { timestamp: '2025-01-02T09:00:00Z', itemName: 'Widget B', reason: 'RETURNED_TO_SUPPLIER', delta: -2 },
    ]);
    setup(queryClient, { supplierId: 'sup-2', from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(getStockUpdates).toHaveBeenCalledWith({ from: '2025-01-01', to: '2025-01-31', supplierId: 'sup-2' });
    });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2'));
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-stack-offset', 'sign');
    expect(screen.getByTestId('reference-line')).toHaveAttribute('data-y', '0');
    const bars = screen.getAllByTestId('bar-series');
    expect(bars.map((el) => [el.getAttribute('data-key'), el.getAttribute('data-name'), el.getAttribute('data-stack')])).toEqual([
      ['returnIn', 'Returned by customer', 'activity'],
      ['sale', 'Sold', 'activity'],
      ['returnOut', 'Returned to supplier', 'activity'],
    ]);
  });

  it('keeps each kind in its colour whatever else is present', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'SOLD', delta: -5 },
    ]);
    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(screen.getByTestId('bar-series')).toBeInTheDocument());
    const soldAlone = screen.getByTestId('bar-series').getAttribute('data-fill');

    queryClient = createClient();
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'INITIAL_STOCK', delta: 5 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'MANUAL_UPDATE', delta: 1 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'RETURNED_BY_CUSTOMER', delta: 1 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'SOLD', delta: -5 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'LOST', delta: -1 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'RETURNED_TO_SUPPLIER', delta: -1 },
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'A', reason: 'NEW_CODE', delta: 1 },
    ]);
    const view = setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(view.getAllByTestId('bar-series').length).toBeGreaterThan(1));
    const fills = Object.fromEntries(view.getAllByTestId('bar-series').map((el) => [el.getAttribute('data-key'), el.getAttribute('data-fill')]));
    expect(fills.sale).toBe(soldAlone);
    expect(new Set(Object.values(fills)).size).toBe(7);
  });

  it('places days on a time axis padded by half a day', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-01-10T12:00:00Z', itemName: 'A', reason: 'SOLD', delta: -5 },
    ]);
    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(lastXAxis).toMatchObject({ type: 'number', scale: 'time' });
    expect(lastXAxis?.domain).toEqual([Date.parse('2025-01-01') - 43_200_000, Date.parse('2025-01-31') + 43_200_000]);
    expect(lastXAxis?.ticks?.[0]).toBe(Date.parse('2025-01-01'));
    expect(lastTooltipLabelFormatter?.(Date.parse('2025-01-10'))).toBe('2025-01-01');
  });

  it('groups a long range by week, pads by half a week and labels the week', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2026-06-09T12:00:00Z', itemName: 'A', reason: 'SOLD', delta: -5 },
      { timestamp: '2026-06-11T12:00:00Z', itemName: 'A', reason: 'SOLD', delta: -2 },
    ]);
    setup(queryClient, { from: '2026-04-15', to: '2026-10-12' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '1'));
    expect(lastXAxis?.domain).toEqual([Date.parse('2026-04-15') - 302_400_000, Date.parse('2026-10-12') + 302_400_000]);
    expect(lastTooltipLabelFormatter?.(Date.parse('2026-06-08'))).toBe('Week of 2025-01-01');
  });

  it('orders the legend and the tooltip stock in first, then stock out', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'Widget A', reason: 'SOLD', delta: -5 },
    ]);
    setup(queryClient, { from: '2025-01-01', to: '2025-01-31' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    const keys = ['other', 'returnOut', 'writeOff', 'sale', 'returnIn', 'adjustment', 'initialStock'];
    const expected = ['initialStock', 'adjustment', 'returnIn', 'sale', 'writeOff', 'returnOut', 'other'];
    expect(legendOrderOf(keys)).toEqual(expected);
    expect(tooltipOrderOf(keys)).toEqual(expected);
  });

  it('formats axis counts and tooltip pieces', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([
      { timestamp: '2025-02-01T10:00:00Z', itemName: 'C', reason: 'SOLD', delta: -2 },
    ]);
    setup(queryClient, { from: '2025-02-01', to: '2025-02-28' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(lastYTickFormatter?.(1234)).toBe('1234');
    expect(lastTooltipFormatter?.(-1234)).toBe('-1234 pcs');
    expect(lastXAxis?.tickFormatter?.(Date.parse('2025-02-01'))).toBe('2025-01-01');
  });
});
