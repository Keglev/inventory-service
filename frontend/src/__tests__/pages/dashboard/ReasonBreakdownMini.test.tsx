/**
 * @file ReasonBreakdownMini.test.tsx
 * @module __tests__/pages/dashboard/ReasonBreakdownMini
 * @description
 * Enterprise tests for ReasonBreakdownMini:
 * - Loading state (skeleton)
 * - Empty state when all reasons have zero movement
 * - Renders increase and decrease bars for reasons with movement
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ReasonBreakdownRow } from '@/api/analytics/reasonBreakdown';
import { getReasonBreakdown } from '@/api/analytics/reasonBreakdown';
import ReasonBreakdownMini from '@/pages/dashboard/blocks/ReasonBreakdownMini';
import { getDaysAgoIso, getTodayIso } from '@/utils/formatters';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ userPreferences: { numberFormat: 'en-US' } }),
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        success: { main: '#70AD47' },
        error: { main: '#C00000' },
        background: { paper: '#111111' },
        divider: '#333333',
        text: { primary: '#eeeeee' },
      },
    }),
  };
});

let lastLegendSorter: ((item: { dataKey?: unknown }) => number) | null = null;
const legendOrderOf = (keys: string[]) =>
  [...keys].sort((a, b) => (lastLegendSorter?.({ dataKey: a }) ?? 0) - (lastLegendSorter?.({ dataKey: b }) ?? 0));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey?: string }) => <div data-testid="bar" data-key={dataKey} />,
  CartesianGrid: () => <div data-testid="grid" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: ({ itemSorter }: { itemSorter?: (item: { dataKey?: unknown }) => number }) => {
    lastLegendSorter = itemSorter ?? null;
    return <div data-testid="legend" />;
  },
}));

vi.mock('@/api/analytics/reasonBreakdown', () => ({
  getReasonBreakdown: vi.fn(),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
function setup(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <ReasonBreakdownMini />
    </QueryClientProvider>,
  );
}

describe('ReasonBreakdownMini', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders loading skeleton while query is in flight', () => {
    vi.mocked(getReasonBreakdown).mockReturnValue(new Promise(() => {}) as Promise<ReasonBreakdownRow[]>);
    const { container } = setup(queryClient);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows the empty state when all reasons have zero movement', async () => {
    vi.mocked(getReasonBreakdown).mockResolvedValue([{ reason: 'SOLD', increase: 0, decrease: 0 }]);
    setup(queryClient);
    await waitFor(() => expect(screen.getByText('dashboard.reasons.empty')).toBeInTheDocument());
  });

  it('renders increase and decrease bars for reasons with movement', async () => {
    vi.mocked(getReasonBreakdown).mockResolvedValue([
      { reason: 'SOLD', increase: 0, decrease: 40 },
      { reason: 'RETURNED_BY_CUSTOMER', increase: 12, decrease: 0 },
    ]);
    setup(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2'));
    const bars = screen.getAllByTestId('bar').map((b) => b.getAttribute('data-key'));
    expect(bars).toContain('increase');
    expect(bars).toContain('decrease');
  });

  it('orders the legend increase before decrease', async () => {
    vi.mocked(getReasonBreakdown).mockResolvedValue([{ reason: 'SOLD', increase: 0, decrease: 40 }]);
    setup(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(legendOrderOf(['decrease', 'increase'])).toEqual(['increase', 'decrease']);
  });

  it('requests the last 90 days, the window its title names', async () => {
    vi.mocked(getReasonBreakdown).mockResolvedValue([]);
    setup(queryClient);
    await waitFor(() => expect(getReasonBreakdown).toHaveBeenCalled());
    expect(getReasonBreakdown).toHaveBeenCalledWith({ from: getDaysAgoIso(90), to: getTodayIso() });
  });

});
