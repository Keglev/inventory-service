/**
 * @file RecentStockActivitycard.test.tsx
 * @module __tests__/pages/analytics/RecentStockActivitycard
 */

import type { ReactNode } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StockUpdateRow } from '../../../../../api/analytics/updates';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('../../../../../utils/formatters', async () => {
  const actual = await vi.importActual<typeof import('../../../../../utils/formatters')>(
    '../../../../../utils/formatters'
  );
  return {
    ...actual,
    formatDate: vi.fn(() => '2025-01-01'),
    formatNumber: vi.fn((value: number) => value.toString()),
  };
});

vi.mock('../../../../../api/analytics/updates', () => ({
  getStockUpdates: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>{children}</div>
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

const { getStockUpdates } = await import('../../../../../api/analytics/updates');
const RecentStockActivityCard = (await import('../../../../../pages/analytics/blocks/RecentStockActivityCard')).default;
const mockedGetStockUpdates = getStockUpdates as MockedFunction<typeof getStockUpdates>;

describe('RecentStockActivitycard', () => {
  let queryClient: QueryClient;

  const renderCard = (props: React.ComponentProps<typeof RecentStockActivityCard>) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RecentStockActivityCard {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders loading skeleton while fetching', () => {
    mockedGetStockUpdates.mockReturnValue(new Promise(() => {}));
    renderCard({ supplierId: 'sup-1' });
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows empty state when no updates found', async () => {
    mockedGetStockUpdates.mockResolvedValue([]);

    renderCard({ supplierId: 'sup-1' });

    await waitFor(() => {
      expect(screen.getByText('No updates in this period.')).toBeInTheDocument();
    });
  });

  it('renders stacked bars when updates exist', async () => {
    const updates: StockUpdateRow[] = [
      { timestamp: '2025-01-01T12:00:00Z', itemName: 'Widget A', reason: 'Sale order', delta: -5 },
      { timestamp: '2025-01-01T13:00:00Z', itemName: 'Widget A', reason: 'Return', delta: 3 },
      { timestamp: '2025-01-02T09:00:00Z', itemName: 'Widget B', reason: 'Write off damage', delta: -2 },
    ];
    mockedGetStockUpdates.mockResolvedValue(updates);

    renderCard({ supplierId: 'sup-2', from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(mockedGetStockUpdates).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-2',
        limit: 200,
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });

    const bars = screen.getAllByTestId('bar-series');
    const dataKeys = bars.map((el) => el.getAttribute('data-key'));
    expect(dataKeys).toEqual(expect.arrayContaining(['sale', 'return', 'writeOff']));
  });
});
