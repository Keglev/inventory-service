/**
 * @file LowStockMini.test.tsx
 * @module __tests__/components/pages/dashboard/LowStockMini
 * @description
 * Enterprise tests for LowStockMini:
 * - Loading state (skeleton)
 * - Empty state when the summary returns no low-stock rows
 * - One bar per item, most critical first, coloured by severity
 * - Five rows per page with the table pagination bar (counter and arrows)
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LowStockRow } from '@/api/analytics/types';
import { getDashboardLowStock } from '@/api/analytics/dashboardSummary';
import LowStockMini from '@/pages/dashboard/blocks/LowStockMini';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts?.count !== undefined ? `${key}:${opts.count}` : key),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ userPreferences: { numberFormat: 'en-US' } }),
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        error: { main: '#C00000' },
        warning: { main: '#FFC000' },
        background: { paper: '#111111' },
        divider: '#333333',
        text: { primary: '#eeeeee' },
      },
    }),
  };
});

const chart = vi.hoisted(() => ({ data: [] as unknown[] }));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children, data }: { children?: ReactNode; data: Array<{ itemName: string }> }) => {
    chart.data = data;
    return (
      <div data-testid="bar-chart" data-length={data.length} data-names={data.map((d) => d.itemName).join('|')}>
        {children}
      </div>
    );
  },
  Bar: ({ dataKey, children }: { dataKey?: string; children?: ReactNode }) => (
    <div data-testid="bar" data-key={dataKey}>{children}</div>
  ),
  Cell: ({ fill }: { fill?: string }) => <div data-testid="cell" data-fill={fill} />,
  LabelList: () => <div data-testid="label-list" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  // Renders the tooltip body for the first bar, as if it were hovered.
  Tooltip: ({ content }: { content: (p: { active: boolean; payload: Array<{ payload: unknown }> }) => ReactNode }) => (
    <div data-testid="tooltip">{content({ active: true, payload: [{ payload: chart.data[0] }] })}</div>
  ),
}));

vi.mock('@/api/analytics/dashboardSummary', () => ({
  getDashboardLowStock: vi.fn(),
}));

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
function setup(client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <LowStockMini />
    </QueryClientProvider>,
  );
}

describe('LowStockMini', () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders loading skeleton while query is in flight', () => {
    vi.mocked(getDashboardLowStock).mockReturnValue(new Promise(() => {}) as Promise<LowStockRow[]>);
    const { container } = setup(queryClient);
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows the empty state when there are no low-stock items', async () => {
    vi.mocked(getDashboardLowStock).mockResolvedValue([]);
    setup(queryClient);
    await waitFor(() => expect(screen.getByText('dashboard.lowStockChart.empty')).toBeInTheDocument());
  });

  const row = (itemName: string, quantity: number, minimumQuantity: number): LowStockRow => ({
    itemName, quantity, minimumQuantity,
  });

  it('draws one bar per item, most critical first, coloured by severity', async () => {
    vi.mocked(getDashboardLowStock).mockResolvedValue([
      row('Low B', 8, 10),
      row('Critical A', 1, 10),
      row('Low C', 15, 25),
    ]);
    setup(queryClient);

    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '3'));
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-names', 'Critical A|Low C|Low B');
    expect(screen.getAllByTestId('bar').map((b) => b.getAttribute('data-key'))).toEqual(['share']);
    expect(screen.getAllByTestId('cell').map((c) => c.getAttribute('data-fill'))).toEqual(['#C00000', '#FFC000', '#FFC000']);
    expect(screen.getByText('1\u20133 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });

  it('shows the full name and both quantities in the tooltip and a legend of both severities', async () => {
    vi.mocked(getDashboardLowStock).mockResolvedValue([
      row('Mini Screubendeher Set 117 torx elektronik Reparatur', 1, 10),
    ]);
    setup(queryClient);

    const tooltip = await screen.findByTestId('tooltip');
    expect(tooltip).toHaveTextContent('Mini Screubendeher Set 117 torx elektronik Reparatur');
    expect(tooltip).toHaveTextContent('dashboard.lowStockChart.quantity: 1');
    expect(tooltip).toHaveTextContent('dashboard.lowStockChart.minimum: 10');
    expect(screen.getByText('dashboard.lowStockChart.critical')).toBeInTheDocument();
    expect(screen.getByText('dashboard.lowStockChart.low')).toBeInTheDocument();
  });

  it('pages through the items five at a time with the arrows', async () => {
    const user = userEvent.setup();
    vi.mocked(getDashboardLowStock).mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => row(`Item ${i + 1}`, i + 1, 10)),
    );
    setup(queryClient);

    await waitFor(() => expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '5'));
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-names', 'Item 1|Item 2|Item 3|Item 4|Item 5');
    expect(screen.getByText('1\u20135 of 7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-names', 'Item 6|Item 7');
    expect(screen.getByText('6\u20137 of 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /previous page/i }));
    expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '5');
  });
});
