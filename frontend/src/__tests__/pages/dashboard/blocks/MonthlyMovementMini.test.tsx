/**
 * @file MonthlyMovementMini.test.tsx
 * @module __tests__/pages/dashboard/blocks/MonthlyMovementMini
 * @description Enterprise tests for the MonthlyMovementMini dashboard block.
 *
 * Contract under test:
 * - Renders a localized card title ("Stock movement (90d)").
 * - Uses React Query to fetch monthly movement data and renders a bar chart when available.
 * - Shows a loading placeholder while the query is pending.
 *
 * Test strategy:
 * - React Query is wrapped with QueryClientProvider (retry:false).
 * - Analytics API call is mocked deterministically (no network).
 * - Date formatter helpers are mocked deterministically (no real time).
 * - Recharts components are mocked to make DOM assertions stable and independent of SVG rendering.
 *
 * Notes:
 * - We intentionally avoid asserting on MUI class names (implementation detail).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/__tests__/test/queryClient';

import MonthlyMovementMini from '@/pages/dashboard/blocks/MonthlyMovementMini';
import { tEn } from '@/__tests__/test/i18nEn';

// -------------------------------------
// Deterministic mocks
// -------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer defaultValue for stable user-visible copy where used.
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: { language: 'en' },
  }),
}));

vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      success: { main: '#4caf50' },
      error: { main: '#f44336' },
      background: { paper: '#111111' },
      divider: '#333333',
      text: { primary: '#eeeeee' },
      action: { selected: 'rgba(255, 255, 255, 0.16)' },
    },
  }),
}));

/**
 * API: mocked as a resolved promise with fixed dataset.
 * This is what the chart wiring is built around.
 */
const mockGetMonthlyStockMovement = vi.hoisted(() =>
  vi.fn(() =>
    Promise.resolve([
      { month: 'Jan', stockIn: 100, stockOut: 50 },
      { month: 'Feb', stockIn: 120, stockOut: 60 },
      { month: 'Mar', stockIn: 110, stockOut: 55 },
    ]),
  ),
);

vi.mock('@/api/analytics/stock', () => ({
  getMonthlyStockMovement: mockGetMonthlyStockMovement,
}));

/**
 * Date utilities must be deterministic for query keys / request params.
 * Avoid using real Date() in tests.
 */
vi.mock('@/utils/formatters', async (importOriginal) => ({
  // Real formatDate for the month labels; fixed dates for the 90-day window.
  ...(await importOriginal<typeof import('@/utils/formatters')>()),
  getTodayIso: () => '2024-12-22',
  getDaysAgoIso: (days: number) => (days === 90 ? '2024-09-23' : '2024-01-01'),
  formatNumber: (num: number) => String(num),
}));

/**
 * Settings context is mocked: the component reads numberFormat for the
 * axis/tooltip formatters.
 */
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'EN_US', dateFormat: 'YYYY-MM-DD', tableDensity: 'standard' },
  }),
}));

/**
 * Recharts is mocked to avoid brittle SVG assertions.
 * We assert on semantic "chart exists / bars exist / labels exist".
 */
vi.mock('recharts', () => ({
  ResponsiveContainer: vi.fn(({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  )),
  BarChart: vi.fn(({ data, children }) => (
    <div data-testid="bar-chart">
      {data?.map((d: { month: string }) => (
        <div key={d.month}>{d.month}</div>
      ))}
      {children}
    </div>
  )),
  CartesianGrid: vi.fn(() => <div data-testid="cartesian-grid" />),
  XAxis: vi.fn(({ tickFormatter }: { tickFormatter?: (v: string) => string }) => {
    lastXTickFormatter = tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  }),
  YAxis: vi.fn(({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastYTickFormatter = tickFormatter ?? null;
    return <div data-testid="y-axis" />;
  }),
  Tooltip: vi.fn(
    ({
      formatter,
      labelFormatter,
      itemSorter,
    }: {
      formatter?: (v: number | string) => string;
      labelFormatter?: (v: string) => string;
      itemSorter?: (item: { dataKey?: unknown }) => number;
    }) => {
    lastTooltipFormatter = formatter ?? null;
    lastTooltipSorter = itemSorter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  ),
  Legend: vi.fn(({ itemSorter }: { itemSorter?: (item: { dataKey?: unknown }) => number }) => {
    lastLegendSorter = itemSorter ?? null;
    return <div data-testid="legend" />;
  }),
  Bar: vi.fn(({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />),
}));

let lastLegendSorter: ((item: { dataKey?: unknown }) => number) | null = null;
let lastTooltipSorter: ((item: { dataKey?: unknown }) => number) | null = null;
const tooltipOrderOf = (keys: string[]) =>
  [...keys].sort((a, b) => (lastTooltipSorter?.({ dataKey: a }) ?? 0) - (lastTooltipSorter?.({ dataKey: b }) ?? 0));
const legendOrderOf = (keys: string[]) =>
  [...keys].sort((a, b) => (lastLegendSorter?.({ dataKey: a }) ?? 0) - (lastLegendSorter?.({ dataKey: b }) ?? 0));
let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastXTickFormatter: ((v: string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: string) => string) | null = null;

// -------------------------------------
// Helpers
// -------------------------------------

function renderMonthlyMovementMini(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MonthlyMovementMini />
    </QueryClientProvider>,
  );
}

describe('MonthlyMovementMini', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  it('renders the card title', () => {
    renderMonthlyMovementMini(queryClient);
    expect(screen.getByText('Stock movement, last 90 days (pieces)')).toBeInTheDocument();
  });

  it('shows a loading placeholder while the query is pending', () => {
    // Force the query to stay pending for this test.
    mockGetMonthlyStockMovement.mockReturnValueOnce(new Promise(() => undefined));

    renderMonthlyMovementMini(queryClient);

    /**
     * We do not assert on MUI Skeleton classnames.
     * Instead, we assert that the chart is not yet rendered while loading.
     */
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
  });

  it('renders the chart scaffold and bars once data is loaded', async () => {
    renderMonthlyMovementMini(queryClient);

    // Query resolves -> chart should appear.
    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    // Basic chart scaffold.
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();

    // Data presence: month labels and expected bars.
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();

    expect(screen.getByTestId('bar-stockIn')).toBeInTheDocument();
    expect(screen.getByTestId('bar-stockOut')).toBeInTheDocument();
  });

  it('orders the legend stock in before stock out', async () => {
    renderMonthlyMovementMini(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(legendOrderOf(['stockOut', 'stockIn'])).toEqual(['stockIn', 'stockOut']);
  });

  it('tolerates an empty payload and formats axis/tooltip values', async () => {
    // getMonthlyStockMovement is typed Promise<MonthlyMovement[]> and returns []
    // on a non-array body and on any thrown error, so undefined is unreachable.
    // Stubbing it here forced a state production cannot produce and made TanStack
    // Query warn that a query function must not resolve undefined.
    mockGetMonthlyStockMovement.mockResolvedValue([]);

    renderMonthlyMovementMini(queryClient);

    // With an empty payload the chart still renders.
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());

    expect(lastYTickFormatter?.(1234)).toBe('1234');
    expect(lastTooltipFormatter?.(1234)).toBe(`1234 ${tEn('units.pieces')}`);
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
  });

  it('labels months on the axis and names the covered dates of partial months in the tooltip', async () => {
    renderMonthlyMovementMini(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());

    expect(lastXTickFormatter?.('2024-10')).toBe('Oct 2024');
    // The 90-day window runs 2024-09-23 .. 2024-12-22: September and December are partial.
    expect(lastTooltipLabelFormatter?.('2024-09')).toBe('September 2024 (2024-09-23 – 2024-09-30)');
    expect(lastTooltipLabelFormatter?.('2024-10')).toBe('October 2024');
    expect(lastTooltipLabelFormatter?.('2024-12')).toBe('December 2024 (2024-12-01 – 2024-12-22)');
  });

  it('lists tooltip series stock in before stock out, like the legend', async () => {
    renderMonthlyMovementMini(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(tooltipOrderOf(['stockOut', 'stockIn'])).toEqual(['stockIn', 'stockOut']);
  });
});
