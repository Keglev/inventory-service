/**
 * @file MonthlyMovementMini.test.tsx
 * @module __tests__/components/pages/dashboard/blocks/MonthlyMovementMini
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

import MonthlyMovementMini from '../../../../pages/dashboard/blocks/MonthlyMovementMini';

// -------------------------------------
// Deterministic mocks
// -------------------------------------
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer defaultValue for stable user-visible copy where used.
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      success: { main: '#4caf50' },
      error: { main: '#f44336' },
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

vi.mock('../../../../api/analytics', () => ({
  getMonthlyStockMovement: mockGetMonthlyStockMovement,
}));

/**
 * Date utilities must be deterministic for query keys / request params.
 * Avoid using real Date() in tests.
 */
vi.mock('../../../../utils/formatters', () => ({
  getTodayIso: () => '2024-12-22',
  getDaysAgoIso: (days: number) => (days === 90 ? '2024-09-23' : '2024-01-01'),
}));

/**
 * Recharts is mocked to avoid brittle SVG assertions.
 * We assert on semantic “chart exists / bars exist / labels exist”.
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
  XAxis: vi.fn(() => <div data-testid="x-axis" />),
  YAxis: vi.fn(() => <div data-testid="y-axis" />),
  Tooltip: vi.fn(() => <div data-testid="tooltip" />),
  Legend: vi.fn(() => <div data-testid="legend" />),
  Bar: vi.fn(({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />),
}));

// -------------------------------------
// Helpers
// -------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

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
    expect(screen.getByText('Stock movement (90d)')).toBeInTheDocument();
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

    // Query resolves → chart should appear.
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
});
