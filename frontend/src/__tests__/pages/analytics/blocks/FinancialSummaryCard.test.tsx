/**
 * @file FinancialSummaryCard.test.tsx
 * @module __tests__/pages/analytics/blocks/FinancialSummaryCard
 * @description
 * Enterprise tests for FinancialSummaryCard:
 * - Supplier requirement gate (no fetch without supplier)
 * - Query parameters passed to API
 * - Loading state, KPI/chart rendering, and empty state
 * - Refetch behavior when supplierId changes
 * - Valuation caption from the reported costing method
 * - Horizontal bars: every category label drawn, value axis sized to its labels
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
    t: (key: string, opts?: { method?: string }) => (opts?.method ? `${key}|${opts.method}` : key),
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/api/analytics/finance', () => ({
  getFinancialSummary: vi.fn(),
}));

let lastXTickFormatter: ((v: string | number) => string) | null = null;
let chartProps: Record<string, Record<string, unknown>> = {};
let lastTooltipFormatter: ((v: number | string) => string) | null = null;

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
  BarChart: ({ children, ...props }: { children?: ReactNode }) => {
    chartProps.barChart = props;
    return <div data-testid="bar-chart">{children}</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: (props: { tickFormatter?: (v: string | number) => string }) => {
    chartProps.xAxis = props;
    lastXTickFormatter = props.tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  },
  YAxis: (props: Record<string, unknown>) => {
    chartProps.yAxis = props;
    return <div data-testid="y-axis" />;
  },
  Tooltip: ({ formatter }: { formatter?: (v: number | string) => string }) => {
    lastTooltipFormatter = formatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Bar: (props: { children?: ReactNode }) => {
    chartProps.bar = props;
    return <div data-testid="bar">{props.children}</div>;
  },
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
  method: 'WAC',
};

const zeroSummary: FinancialSummary = {
  openingValue: 0,
  endingValue: 0,
  purchases: 0,
  cogs: 0,
  writeOffs: 0,
  returns: 0,
  method: 'WAC',
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('FinancialSummaryCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    chartProps = {};
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

  it('formats axis and tooltip money values and passes strings through', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);

    setup(queryClient, { supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());

    expect(lastXTickFormatter?.(1234.5)).toBe('1,234.50');
    expect(lastTooltipFormatter?.(1234.5)).toBe('1,234.50 €');
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
  });

  it('renders an em-dash KPI when the backend omits a figure', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue({
      ...nonZeroSummary,
      openingValue: undefined,
    } as unknown as FinancialSummary);

    setup(queryClient, { supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument());
  });

  it('names the WAC valuation basis under the title', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);
    setup(queryClient, { supplierId: 'sup-123' });
    expect(await screen.findByTestId('valuation-basis')).toHaveTextContent(/^analytics:finance\.valuation\.wac$/);
  });

  it('shows an unknown costing method by its code', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue({ ...nonZeroSummary, method: 'FIFO' });
    setup(queryClient, { supplierId: 'sup-123' });
    expect(await screen.findByTestId('valuation-basis')).toHaveTextContent('analytics:finance.valuation.other|FIFO');
  });

  it('shows no valuation caption when the backend reports no method', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue({ ...nonZeroSummary, method: '' });
    setup(queryClient, { supplierId: 'sup-123' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(screen.queryByTestId('valuation-basis')).not.toBeInTheDocument();
  });

  it('draws horizontal bars with every category label and a self-sizing label axis', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);
    setup(queryClient, { supplierId: 'sup-123' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(chartProps.barChart).toMatchObject({ layout: 'vertical' });
    expect(chartProps.xAxis).toMatchObject({ type: 'number' });
    expect(chartProps.yAxis).toMatchObject({ type: 'category', dataKey: 'name', width: 'auto', interval: 0 });
  });

  it('names the bar series for the tooltip', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue(nonZeroSummary);
    setup(queryClient, { supplierId: 'sup-123' });
    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());
    expect(chartProps.bar).toMatchObject({ dataKey: 'value', name: 'analytics:finance.amount' });
  });
});
