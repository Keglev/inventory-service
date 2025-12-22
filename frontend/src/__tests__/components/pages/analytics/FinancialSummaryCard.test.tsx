/**
 * @file FinancialSummaryCard.test.tsx
 * @module __tests__/pages/analytics/FinancialSummaryCard
 * 
 * @summary
 * Tests for FinancialSummaryCard component.
 * Tests supplier requirement, data fetching, KPI rendering, and empty states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { FinancialSummary } from '../../../../api/analytics/finance';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../../api/analytics/finance', () => ({
  getFinancialSummary: vi.fn(),
}));

vi.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
}));

const { getFinancialSummary } = await import('../../../../api/analytics/finance');
const FinancialSummaryCard = (await import('../../../../pages/analytics/blocks/FinancialSummaryCard')).default;

describe('FinancialSummaryCard', () => {
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
        <FinancialSummaryCard {...props} />
      </QueryClientProvider>
    );
  };

  it('shows select supplier message when no supplier provided', () => {
    renderCard();
    expect(screen.getByText('analytics:frequency.selectSupplier')).toBeInTheDocument();
  });

  it('does not fetch data when no supplier provided', () => {
    renderCard();
    expect(getFinancialSummary).not.toHaveBeenCalled();
  });

  it('fetches data when supplier is provided', async () => {
    const mockData: FinancialSummary = {
      openingValue: 1000,
      endingValue: 1200,
      purchases: 500,
      cogs: 300,
      writeOffs: 50,
      returns: 20,
    };
    vi.mocked(getFinancialSummary).mockResolvedValue(mockData);

    renderCard({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getFinancialSummary).toHaveBeenCalledWith({
        from: '2025-01-01',
        to: '2025-12-31',
        supplierId: 'sup-123',
      });
    });
  });

  it('renders loading skeleton when fetching data', () => {
    vi.mocked(getFinancialSummary).mockReturnValue(new Promise(() => {}));
    renderCard({ supplierId: 'sup-123' });
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders KPIs when data is available', async () => {
    const mockData: FinancialSummary = {
      openingValue: 1000,
      endingValue: 1200,
      purchases: 500,
      cogs: 300,
      writeOffs: 50,
      returns: 20,
    };
    vi.mocked(getFinancialSummary).mockResolvedValue(mockData);

    renderCard({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByText(/opening/i)).toBeInTheDocument();
      expect(screen.getByText(/ending/i)).toBeInTheDocument();
    });
  });

  it('renders bar chart when data is available', async () => {
    const mockData: FinancialSummary = {
      openingValue: 1000,
      endingValue: 1200,
      purchases: 500,
      cogs: 300,
      writeOffs: 50,
      returns: 20,
    };
    vi.mocked(getFinancialSummary).mockResolvedValue(mockData);

    renderCard({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('shows empty state when all financial values are zero', async () => {
    const mockData: FinancialSummary = {
      openingValue: 0,
      endingValue: 0,
      purchases: 0,
      cogs: 0,
      writeOffs: 0,
      returns: 0,
    };
    vi.mocked(getFinancialSummary).mockResolvedValue(mockData);

    renderCard({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByText('analytics:finance.empty')).toBeInTheDocument();
    });
  });

  it('renders title', () => {
    renderCard();
    expect(screen.getByText('analytics:finance.title')).toBeInTheDocument();
  });

  it('refetches when supplierId changes', async () => {
    vi.mocked(getFinancialSummary).mockResolvedValue({
      openingValue: 1000,
      endingValue: 1200,
      purchases: 500,
      cogs: 300,
      writeOffs: 50,
      returns: 20,
    });

    const { rerender } = renderCard({ supplierId: 'sup-1', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getFinancialSummary).toHaveBeenCalledTimes(1);
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <FinancialSummaryCard supplierId="sup-2" from="2025-01-01" to="2025-12-31" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getFinancialSummary).toHaveBeenCalledTimes(2);
    });
  });
});
