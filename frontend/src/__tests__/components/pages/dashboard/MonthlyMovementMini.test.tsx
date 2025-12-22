import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MonthlyMovementMini from '../../../../pages/dashboard/blocks/MonthlyMovementMini';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, defaultVal?: string) => defaultVal || key }),
}));

vi.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      success: { main: '#4caf50' },
      error: { main: '#f44336' },
    },
  }),
}));

vi.mock('../../../../api/analytics', () => ({
  getMonthlyStockMovement: vi.fn(() =>
    Promise.resolve([
      { month: 'Jan', stockIn: 100, stockOut: 50 },
      { month: 'Feb', stockIn: 120, stockOut: 60 },
      { month: 'Mar', stockIn: 110, stockOut: 55 },
    ])
  ),
}));

vi.mock('../../../../utils/formatters', () => ({
  getTodayIso: () => '2024-12-22',
  getDaysAgoIso: (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: vi.fn(({ children }) => <div data-testid="responsive-container">{children}</div>),
  BarChart: vi.fn(({ data, children }) => (
    <div data-testid="bar-chart">
      {data?.map((d: { month: string }) => (
        <div key={d.month}>{d.month}</div>
      ))}
      {children}
    </div>
  )),
  CartesianGrid: vi.fn(() => <div data-testid="cartesian-grid" />),
  XAxis: vi.fn(() => <div data-testid="x-axis" />),
  YAxis: vi.fn(() => <div data-testid="y-axis" />),
  Tooltip: vi.fn(() => <div data-testid="tooltip" />),
  Legend: vi.fn(() => <div data-testid="legend" />),
  Bar: vi.fn(({ dataKey, fill }) => <div data-testid={`bar-${dataKey}`} style={{ fill }} />),
}));

describe('MonthlyMovementMini', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MonthlyMovementMini />
      </QueryClientProvider>
    );
  };

  it('renders card title', () => {
    renderComponent();
    expect(screen.getByText('Stock movement (90d)')).toBeInTheDocument();
  });

  it('shows skeleton loading state initially', () => {
    renderComponent();
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders bar chart when data is loaded', async () => {
    renderComponent();
    // Wait for data to load
    await vi.waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('displays month labels in chart', async () => {
    renderComponent();
    await vi.waitFor(() => {
      expect(screen.getByText('Jan')).toBeInTheDocument();
      expect(screen.getByText('Feb')).toBeInTheDocument();
      expect(screen.getByText('Mar')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('renders responsive container', async () => {
    renderComponent();
    await vi.waitFor(() => {
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('renders chart axes', async () => {
    renderComponent();
    await vi.waitFor(() => {
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('renders tooltip and legend', async () => {
    renderComponent();
    await vi.waitFor(() => {
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('renders both inbound and outbound bars', async () => {
    renderComponent();
    await vi.waitFor(() => {
      expect(screen.getByTestId('bar-stockIn')).toBeInTheDocument();
      expect(screen.getByTestId('bar-stockOut')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
