/**
 * @file FinancialSummaryCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/FinancialSummaryCard
 * @description
 * Enterprise tests for FinancialSummaryCard:
 * - Supplier requirement gate (no fetch without supplier)
 * - Query parameters passed to API
 * - Loading state, KPI/chart rendering, and empty state
 * - Refetch behavior when supplierId changes
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { FinancialSummary } from '@/api/analytics/finance';
import { getFinancialSummary } from '@/api/analytics/finance';
import FinancialSummaryCard from '@/pages/analytics/blocks/FinancialSummaryCard';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/api/analytics/finance', () => ({
  getFinancialSummary: vi.fn(),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children }: { children?: ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function setup(
  client: QueryClient,
  props: Partial<React.ComponentProps<typeof FinancialSummaryCard>> = {},
) {
  return render(
    <QueryClientProvider client={client}>
      <FinancialSummaryCard {...props} />
    </QueryClientProvider>,
  );
}

const nonZeroSummary: FinancialSummary = {
  openingValue: 1000,
  endingValue: 1200,
  purchases: 500,
  cogs: 300,
  writeOffs: 50,
  returns: 20,
};

const zeroSummary: FinancialSummary = {
  openingValue: 0,
  endingValue: 0,
  purchases: 0,
  cogs: 0,
  writeOffs: 0,
  returns: 0,
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('FinancialSummaryCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders title and prompts to select a supplier when supplierId is missing', () => {
    setup(queryClient);

    expect(screen.getByText('analytics:finance.title')).toBeInTheDocument();
    expect(screen.getByText('analytics:frequency.selectSupplier')).toBeInTheDocument();
    expect(getFinancialSummary).not.toHaveBeenCalled();
  });

  it('fetches data when supplier is provided (passes query params)', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);

    setup(queryClient, { supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getFinancialSummary).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: 'sup-123',
      });
    });
  });

  it('renders loading skeleton while fetching data', () => {
    vi.mocked(getFinancialSummary).mockReturnValue(new Promise(() => {}) as Promise<FinancialSummary>);

    const { container } = setup(queryClient, { supplierId: 'sup-123' });

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders KPIs and chart when data is available', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);

    setup(queryClient, { supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      // We keep these assertions intentionally broad (text contract may vary by i18n/layout).
      expect(screen.getByText(/opening/i)).toBeInTheDocument();
      expect(screen.getByText(/ending/i)).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('shows empty state when all financial values are zero', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(zeroSummary);

    setup(queryClient, { supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByText('analytics:finance.empty')).toBeInTheDocument();
    });
  });

  it('refetches when supplierId changes', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);

    const view = setup(queryClient, { supplierId: 'sup-1', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => expect(getFinancialSummary).toHaveBeenCalledTimes(1));

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <FinancialSummaryCard supplierId="sup-2" from="2025-01-01" to="2025-12-31" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(getFinancialSummary).toHaveBeenCalledTimes(2));
  });
});
