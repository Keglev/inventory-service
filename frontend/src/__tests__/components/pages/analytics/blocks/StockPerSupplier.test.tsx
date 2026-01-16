/**
 * @file StockPerSupplier.test.tsx
 * @module __tests__/pages/analytics/StockPerSupplier
 */

import type { ReactNode } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StockPerSupplierPoint } from '../../../../../api/analytics';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
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
        primary: { main: '#1976d2' },
      },
    }),
  };
});

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
  Bar: () => <div data-testid="bar" />,
}));

vi.mock('../../../../../api/analytics', () => ({
  getStockPerSupplier: vi.fn(),
}));

const { getStockPerSupplier } = await import('../../../../../api/analytics');
const StockPerSupplier = (await import('../../../../../pages/analytics/blocks/StockPerSupplier')).default;
const mockedGetStockPerSupplier = getStockPerSupplier as MockedFunction<typeof getStockPerSupplier>;

describe('StockPerSupplier', () => {
  let queryClient: QueryClient;

  const renderCard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <StockPerSupplier />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('shows empty state when no data returned', async () => {
    mockedGetStockPerSupplier.mockResolvedValue([]);

    renderCard();

    await waitFor(() => {
      expect(screen.getByText('analytics:stockPerSupplier.empty')).toBeInTheDocument();
    });
  });

  it('renders chart when supplier data exists', async () => {
    const mockData: StockPerSupplierPoint[] = [
      { supplierName: 'Alpha Supplies', totalQuantity: 120 },
      { supplierName: 'Beta Traders', totalQuantity: 80 },
    ];
    mockedGetStockPerSupplier.mockResolvedValue(mockData);

    renderCard();

    await waitFor(() => {
      expect(mockedGetStockPerSupplier).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });
  });
});
