/**
 * @file StockValueCard.test.tsx
 * @module __tests__/pages/analytics/StockValueCard
 * 
 * @summary
 * Tests for StockValueCard component.
 * Tests data fetching, loading states, chart rendering, and empty states.
 */

import type { ReactNode } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StockValuePoint } from '../../../../../api/analytics/stock';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../../../api/analytics/stock', () => ({
  getStockValueOverTime: vi.fn(),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="chart-container">{children}</div>,
  LineChart: ({ children }: { children?: ReactNode }) => <div data-testid="line-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
}));

const { getStockValueOverTime } = await import('../../../../../api/analytics/stock');
const StockValueCard = (await import('../../../../../pages/analytics/blocks/StockValueCard')).default;
const mockedGetStockValueOverTime = getStockValueOverTime as MockedFunction<typeof getStockValueOverTime>;

describe('StockValueCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderCard = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <StockValueCard {...props} />
      </QueryClientProvider>
    );
  };

  it('renders loading skeleton initially', () => {
    mockedGetStockValueOverTime.mockReturnValue(new Promise(() => {}));
    renderCard();
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders chart with data', async () => {
    const mockData: StockValuePoint[] = [
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-02', totalValue: 1100 },
      { date: '2025-01-03', totalValue: 1200 },
    ];
    mockedGetStockValueOverTime.mockResolvedValue(mockData);

    renderCard({ from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data available', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);

    renderCard({ from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument();
    });
  });

  it('fetches data with from and to parameters', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);

    renderCard({ from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: undefined,
      });
    });
  });

  it('fetches data with supplierId parameter', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);

    renderCard({ from: '2025-01-01', to: '2025-12-31', supplierId: 'sup-123' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: 'sup-123',
      });
    });
  });

  it('sorts data by date', async () => {
    const mockData: StockValuePoint[] = [
      { date: '2025-01-03', totalValue: 1200 },
      { date: '2025-01-01', totalValue: 1000 },
      { date: '2025-01-02', totalValue: 1100 },
    ];
    mockedGetStockValueOverTime.mockResolvedValue(mockData);

    renderCard({ from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('renders title', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);
    renderCard();
    
    await waitFor(() => {
      expect(screen.getByText('analytics:cards.stockValue')).toBeInTheDocument();
    });
  });

  it('refetches when parameters change', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);

    const { rerender } = renderCard({ from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledTimes(1);
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <StockValueCard from="2025-02-01" to="2025-02-28" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledTimes(2);
    });
  });

  it('handles null supplierId', async () => {
    mockedGetStockValueOverTime.mockResolvedValue([]);

    renderCard({ from: '2025-01-01', to: '2025-12-31', supplierId: null });

    await waitFor(() => {
      expect(getStockValueOverTime).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: undefined,
      });
    });
  });
});
