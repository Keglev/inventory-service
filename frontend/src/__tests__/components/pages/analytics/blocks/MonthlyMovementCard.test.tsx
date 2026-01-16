/**
 * @file MonthlyMovementCard.test.tsx
 * @module __tests__/pages/analytics/MonthlyMovementCard
 *
 * @summary
 * Tests MonthlyMovementCard loading, rendering, and query parameter handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { MonthlyMovement } from '../../../../../api/analytics/stock';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        success: { main: '#00aa00' },
        error: { main: '#ff0000' },
      },
    }),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>{children}</div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({ tickFormatter }: { tickFormatter?: (value: unknown) => unknown }) => {
    tickFormatter?.('2025-01');
    return <div data-testid="x-axis" />;
  },
  YAxis: ({ tickFormatter }: { tickFormatter?: (value: unknown) => unknown }) => {
    tickFormatter?.(1000);
    return <div data-testid="y-axis" />;
  },
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
}));

vi.mock('../../../../../api/analytics/stock', () => ({
  getMonthlyStockMovement: vi.fn(),
}));

vi.mock('../../../../../utils/formatters', async () => {
  const actual = await vi.importActual<typeof import('../../../../../utils/formatters')>(
    '../../../../../utils/formatters'
  );
  return {
    ...actual,
    formatDate: vi.fn(() => 'Jan 2025'),
    formatNumber: vi.fn((value: number) => value.toString()),
  };
});

const { getMonthlyStockMovement } = await import('../../../../../api/analytics/stock');
const { formatDate, formatNumber } = await import('../../../../../utils/formatters');
const MonthlyMovementCard = (await import('../../../../../pages/analytics/blocks/MonthlyMovementCard')).default;

describe('MonthlyMovementCard', () => {
  let queryClient: QueryClient;

  const renderCard = (props: React.ComponentProps<typeof MonthlyMovementCard>) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MonthlyMovementCard {...props} />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('shows loading skeleton while the query is pending', () => {
    vi.mocked(getMonthlyStockMovement).mockReturnValue(new Promise(() => {}));
    renderCard({});
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders chart when data resolves', async () => {
    const mockData: MonthlyMovement[] = [
      { month: '2025-01', stockIn: 120, stockOut: 60 },
      { month: '2025-02', stockIn: 150, stockOut: 90 },
    ];
    vi.mocked(getMonthlyStockMovement).mockResolvedValue(mockData);

    renderCard({ from: '2025-01-01', to: '2025-03-01' });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });

    expect(screen.getByTestId('bar-stockIn')).toBeInTheDocument();
    expect(screen.getByTestId('bar-stockOut')).toBeInTheDocument();
  });

  it('passes filters and supplierId to the query', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([]);

    renderCard({ from: '2025-01-01', to: '2025-01-31', supplierId: 'sup-77' });

    await waitFor(() => {
      expect(getMonthlyStockMovement).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-77',
      });
    });
  });

  it('replaces null supplierId with undefined for the query', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([]);

    renderCard({ supplierId: null });

    await waitFor(() => {
      expect(getMonthlyStockMovement).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
        supplierId: undefined,
      });
    });
  });

  it('uses formatters for axis labels and tooltips', async () => {
    const data: MonthlyMovement[] = [{ month: '2025-05', stockIn: 10, stockOut: 5 }];
    vi.mocked(getMonthlyStockMovement).mockResolvedValue(data);

    renderCard({});

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    expect(formatDate).toHaveBeenCalledWith('2025-01', 'MM/dd/yyyy');
    expect(formatNumber).toHaveBeenCalledWith(1000, 'en-US', 0);
  });
});
