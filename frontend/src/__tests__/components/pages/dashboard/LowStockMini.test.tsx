/**
 * @file LowStockMini.test.tsx
 * @module __tests__/components/pages/dashboard/LowStockMini
 * @description
 * Enterprise tests for LowStockMini:
 * - Loading state (skeleton)
 * - Empty state when the summary returns no low-stock rows
 * - Renders quantity and minimum bars when data exists
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LowStockRow } from '@/api/analytics/types';
import { getDashboardLowStock } from '@/api/analytics/dashboardSummary';
import LowStockMini from '@/pages/dashboard/blocks/LowStockMini';

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
        error: { main: '#C00000' },
        warning: { main: '#FFC000' },
        background: { paper: '#111111' },
        divider: '#333333',
        text: { primary: '#eeeeee' },
      },
    }),
  };
});

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
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('@/api/analytics/dashboardSummary', () => ({
  getDashboardLowStock: vi.fn(),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
function setup(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <LowStockMini />
    </QueryClientProvider>,
  );
}

describe('LowStockMini', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders loading skeleton while query is in flight', () => {
    vi.mocked(getDashboardLowStock).mockReturnValue(new Promise(() => {}) as Promise<LowStockRow[]>);
    const { container } = setup(queryClient);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows the empty state when there are no low-stock items', async () => {
    vi.mocked(getDashboardLowStock).mockResolvedValue([]);
    setup(queryClient);
    await waitFor(() => expect(screen.getByText('dashboard.lowStockChart.empty')).toBeInTheDocument());
  });

  it('renders quantity and minimum bars when data exists', async () => {
    const rows: LowStockRow[] = [
      { itemName: 'Widget A', quantity: 2, minimumQuantity: 10 },
      { itemName: 'Widget B', quantity: 5, minimumQuantity: 8 },
    ];
    vi.mocked(getDashboardLowStock).mockResolvedValue(rows);
    setup(queryClient);
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2'));
    const bars = screen.getAllByTestId('bar').map((b) => b.getAttribute('data-key'));
    expect(bars).toContain('quantity');
    expect(bars).toContain('minimumQuantity');
  });
});
