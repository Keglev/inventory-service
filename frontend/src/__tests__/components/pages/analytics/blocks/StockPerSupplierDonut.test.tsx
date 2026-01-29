/**
 * @file StockPerSupplierDonut.test.tsx
 * @module __tests__/components/pages/analytics/blocks/StockPerSupplierDonut
 * @description
 * Enterprise tests for StockPerSupplierDonut:
 * - Loading state (skeleton)
 * - Empty helper when API returns no rows
 * - Donut renders one segment per supplier row
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockPerSupplierPoint } from '@/api/analytics';
import { getStockPerSupplier } from '@/api/analytics';
import StockPerSupplierDonut from '@/pages/analytics/blocks/StockPerSupplierDonut';

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
        primary: { main: '#4472C4' },
        success: { main: '#70AD47' },
        info: { main: '#5B9BD5' },
        warning: { main: '#FFC000' },
        error: { main: '#C00000' },
        secondary: { main: '#7F7F7F' },
      },
    }),
  };
});

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children?: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="pie" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: ({ fill }: { fill?: string }) => <div data-testid="pie-cell" data-fill={fill} />,
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
      <StockPerSupplierDonut />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('StockPerSupplierDonut', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders loading skeleton while query is in flight', () => {
    vi.mocked(getStockPerSupplier).mockReturnValue(
      new Promise(() => {}) as Promise<StockPerSupplierPoint[]>,
    );

    const { container } = setup(queryClient);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows empty helper when dataset is empty', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([]);

    setup(queryClient);

    await waitFor(() => {
      expect(screen.getByText('No supplier data for the current filters.')).toBeInTheDocument();
    });
  });

  it('renders one donut segment per supplier when data exists', async () => {
    const points: StockPerSupplierPoint[] = [
      { supplierName: 'Alpha Supplies', totalQuantity: 120 },
      { supplierName: 'Beta Traders', totalQuantity: 80 },
      { supplierName: 'Gamma Goods', totalQuantity: 40 },
    ];

    vi.mocked(getStockPerSupplier).mockResolvedValue(points);

    setup(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('pie')).toHaveAttribute('data-length', '3');
    });

    expect(screen.getAllByTestId('pie-cell')).toHaveLength(points.length);
  });
});
