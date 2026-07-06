/**
 * @file MovementsSection.test.tsx
 * @summary Orchestration test for the Movements section: one breakdown query
 * feeds both direction cards; the reason chips filter client-side without a
 * refetch; the drilldown table renders row-level data.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      numberFormat: 'DE',
      dateFormat: 'DD.MM.YYYY',
    },
  }),
}));

const mockGetReasonBreakdown = vi.fn();
vi.mock('@/api/analytics/reasonBreakdown', () => ({
  getReasonBreakdown: (...args: unknown[]) => mockGetReasonBreakdown(...args),
}));

const mockGetStockUpdates = vi.fn();
vi.mock('@/api/analytics/updates', () => ({
  getStockUpdates: (...args: unknown[]) => mockGetStockUpdates(...args),
}));

const MovementsSection = (await import('@/pages/analytics/sections/MovementsSection')).default;

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MovementsSection from="2026-01-01" to="2026-06-30" supplierId={undefined} />
    </QueryClientProvider>,
  );
}

describe('MovementsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetReasonBreakdown.mockResolvedValue([
      { reason: 'MANUAL_UPDATE', increase: 5, decrease: 3 },
      { reason: 'SOLD', increase: 0, decrease: 7 },
    ]);
    mockGetStockUpdates.mockResolvedValue([
      { timestamp: '2026-02-03T09:00:00', itemName: 'Item A', delta: -7, reason: 'SOLD' },
    ]);
  });

  it('renders both direction cards and the drilldown from one breakdown query', async () => {
    setup();

    await waitFor(() => {
      expect(screen.getAllByTestId('reason-breakdown-card')).toHaveLength(2);
    });
    expect(screen.getByText('analytics:movements.increasesTitle')).toBeInTheDocument();
    expect(screen.getByText('analytics:movements.decreasesTitle')).toBeInTheDocument();
    expect(mockGetReasonBreakdown).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId('movement-drilldown')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Item A')).toBeInTheDocument();
    });
  });

  it('filters via reason chips client-side without refetching', async () => {
    const user = userEvent.setup();
    setup();

    await waitFor(() => {
      expect(screen.getAllByTestId('reason-breakdown-card')).toHaveLength(2);
    });
    expect(mockGetReasonBreakdown).toHaveBeenCalledTimes(1);

    // Select only SOLD: MANUAL_UPDATE disappears from the increase side.
    await user.click(screen.getByRole('button', { name: 'analytics:reasons.SOLD' }));

    expect(mockGetReasonBreakdown).toHaveBeenCalledTimes(1);
    // Increases card has no visible rows anymore -> shared no-data state.
    await waitFor(() => {
      expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument();
    });
  });

  it('renders the empty state when the drilldown has no rows', async () => {
    mockGetStockUpdates.mockResolvedValue([]);
    setup();

    await waitFor(() => {
      expect(screen.getByText('analytics:movements.empty')).toBeInTheDocument();
    });
  });
});
