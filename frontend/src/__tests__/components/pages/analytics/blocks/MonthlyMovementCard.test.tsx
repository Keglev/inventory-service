/**
 * @file MonthlyMovementCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/MonthlyMovementCard
 * @description
 * Tests MonthlyMovementCard:
 * - loading state
 * - chart rendering
 * - query parameter contract (from/to/supplierId normalization)
 * - axis tick formatter wiring (delegates to formatters)
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { MonthlyMovement } from '@/api/analytics/stock';
import { getMonthlyStockMovement } from '@/api/analytics/stock';
import MonthlyMovementCard from '@/pages/analytics/blocks/MonthlyMovementCard';

// -----------------------------------------------------------------------------
// Formatter spies (we assert calls against these, not against typed imports).
// -----------------------------------------------------------------------------

const mockFormatDate = vi.hoisted(() =>
  vi.fn(() => 'Jan 2025'),
);
const mockFormatNumber = vi.hoisted(() =>
  vi.fn(() => '1000'),
);

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useSettings', () => ({
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
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  // Call tickFormatter with sample values so we can assert formatter wiring deterministically.
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

vi.mock('@/api/analytics/stock', () => ({
  getMonthlyStockMovement: vi.fn(),
}));

vi.mock('@/utils/formatters', async () => {
  const actual = await vi.importActual<typeof import('@/utils/formatters')>('@/utils/formatters');
  return {
    ...actual,
    formatDate: mockFormatDate,
    formatNumber: mockFormatNumber,
  };
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function setup(
  client: QueryClient,
  props: Partial<React.ComponentProps<typeof MonthlyMovementCard>> = {},
) {
  return render(
    <QueryClientProvider client={client}>
      <MonthlyMovementCard {...props} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('MonthlyMovementCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('shows a loading skeleton while the query is pending', () => {
    vi.mocked(getMonthlyStockMovement).mockReturnValue(new Promise(() => {}) as Promise<MonthlyMovement[]>);

    const { container } = setup(queryClient);

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders the chart when data resolves', async () => {
    const mockData: MonthlyMovement[] = [
      { month: '2025-01', stockIn: 120, stockOut: 60 },
      { month: '2025-02', stockIn: 150, stockOut: 90 },
    ];
    vi.mocked(getMonthlyStockMovement).mockResolvedValue(mockData);

    setup(queryClient, { from: '2025-01-01', to: '2025-03-01' });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '2');
    });

    expect(screen.getByTestId('bar-stockIn')).toBeInTheDocument();
    expect(screen.getByTestId('bar-stockOut')).toBeInTheDocument();
  });

  it('passes filters and supplierId to the query', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([]);

    setup(queryClient, { from: '2025-01-01', to: '2025-01-31', supplierId: 'sup-77' });

    await waitFor(() => {
      expect(getMonthlyStockMovement).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-77',
      });
    });
  });

  it('normalizes null supplierId to undefined for the query', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([]);

    setup(queryClient, { supplierId: null });

    await waitFor(() => {
      expect(getMonthlyStockMovement).toHaveBeenCalledWith({
        from: undefined,
        to: undefined,
        supplierId: undefined,
      });
    });
  });

  it('delegates axis tick formatting to the formatter utilities', async () => {
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([{ month: '2025-05', stockIn: 10, stockOut: 5 }]);

    setup(queryClient);

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    // We assert "wiring" (called) without coupling to exact formatter signatures.
    expect(mockFormatDate).toHaveBeenCalled();
    expect(mockFormatNumber).toHaveBeenCalled();
  });
});
