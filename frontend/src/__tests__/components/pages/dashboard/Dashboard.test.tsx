import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../../../pages/dashboard/Dashboard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockUseDashboardMetrics = vi.hoisted(() => vi.fn());

vi.mock('../../../../api/analytics/hooks', () => ({
  useDashboardMetrics: mockUseDashboardMetrics,
}));

vi.mock('../../../../pages/dashboard/blocks/MonthlyMovementMini', () => ({
  default: vi.fn(() => <div data-testid="monthly-movement">Monthly Movement Chart</div>),
}));

vi.mock('../../../../components/ui/StatCard', () => ({
  default: vi.fn(({ title, value, loading }) => (
    <div data-testid={`stat-card-${title}`}>
      {loading ? <div>Loading...</div> : <div>{value ?? '—'}</div>}
    </div>
  )),
}));

vi.mock('../../../../features/help', () => ({
  HelpIconButton: vi.fn(() => <button data-testid="help-button">Help</button>),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    mockUseDashboardMetrics.mockReturnValue({
      data: {
        inventoryCount: 1500,
        suppliersCount: 25,
        lowStockCount: 8,
      },
      isLoading: false,
      error: null,
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders dashboard title', () => {
    renderComponent();
    expect(screen.getByText('dashboard.title')).toBeInTheDocument();
  });

  it('renders three KPI stat cards', () => {
    renderComponent();
    expect(screen.getByTestId('stat-card-dashboard.kpi.totalItems')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-dashboard.kpi.suppliers')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-dashboard.kpi.lowStock')).toBeInTheDocument();
  });

  it('displays inventory count in stat card', () => {
    renderComponent();
    expect(screen.getByText('1500')).toBeInTheDocument();
  });

  it('displays suppliers count in stat card', () => {
    renderComponent();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('displays low stock count in stat card', () => {
    renderComponent();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders monthly movement chart', () => {
    renderComponent();
    expect(screen.getByTestId('monthly-movement')).toBeInTheDocument();
  });

  it('renders help button', () => {
    renderComponent();
    expect(screen.getByTestId('help-button')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    renderComponent();
    expect(screen.getByText('dashboard.actions.manageInventory')).toBeInTheDocument();
    expect(screen.getByText('dashboard.actions.manageSuppliers')).toBeInTheDocument();
    expect(screen.getByText('dashboard.actions.viewAnalytics')).toBeInTheDocument();
  });

  it('navigates to inventory when manage inventory button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const button = screen.getByText('dashboard.actions.manageInventory');
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/inventory');
  });

  it('navigates to suppliers when manage suppliers button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const button = screen.getByText('dashboard.actions.manageSuppliers');
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/suppliers');
  });

  it('navigates to analytics when view analytics button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    const button = screen.getByText('dashboard.actions.viewAnalytics');
    await user.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/overview');
  });

  it('shows loading state for stat cards when data is loading', () => {
    mockUseDashboardMetrics.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof mockUseDashboardMetrics>);
    renderComponent();
    expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
  });

  it('displays em-dash when metrics data is unavailable', () => {
    mockUseDashboardMetrics.mockReturnValue({
      data: {
        inventoryCount: null,
        suppliersCount: null,
        lowStockCount: null,
      },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof mockUseDashboardMetrics>);
    renderComponent();
    const emDashes = screen.getAllByText('—');
    expect(emDashes.length).toBeGreaterThan(0);
  });
});
