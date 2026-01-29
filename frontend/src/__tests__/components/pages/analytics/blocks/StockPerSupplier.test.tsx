/**
 * @file StockPerSupplier.test.tsx
 * @module __tests__/components/pages/analytics/blocks/StockPerSupplier
 * @description
 * Enterprise tests for StockPerSupplier:
 * - Empty state when API returns no rows
 * - Chart renders when supplier rows exist
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockPerSupplierPoint } from '@/api/analytics';
import { getStockPerSupplier } from '@/api/analytics';
import StockPerSupplier from '@/pages/analytics/blocks/StockPerSupplier';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
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
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: () => <div data-testid="bar" />,
}));

vi.mock('@/api/analytics', () => ({
  getStockPerSupplier: vi.fn(),
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function setup(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <StockPerSupplier />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('StockPerSupplier', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('shows empty state when no data is returned', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([]);

    setup(queryClient);

    await waitFor(() => {
      expect(screen.getByText('analytics:stockPerSupplier.empty')).toBeInTheDocument();
    });
  });

  it('renders chart when supplier data exists', async () => {
    const mockData: StockPerSupplierPoint[] = [
      { supplierName: 'Alpha Supplies', totalQuantity: 120 },
      { supplierName: 'Beta Traders', totalQuantity: 80 },
    ];

    vi.mocked(getStockPerSupplier).mockResolvedValue(mockData);

    setup(queryClient);

    await waitFor(() => {
      expect(getStockPerSupplier).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });
  });
});
