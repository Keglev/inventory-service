/**
 * @file Dashboard.test.tsx
 * @module __tests__/components/pages/dashboard/Dashboard
 * @description Enterprise integration tests for the Dashboard page.
 *
 * Contract under test:
 * - Renders the dashboard title and KPI cards bound to useDashboardMetrics().
 * - Renders the monthly movement block and the contextual help entry point.
 * - Exposes primary navigation actions (Inventory, Suppliers, Analytics) via buttons.
 * - Handles loading and "no data" states deterministically.
 *
 * Test strategy:
 * - useDashboardMetrics is mocked (no network).
 * - Child blocks are mocked to keep the suite focused on wiring + navigation contracts.
 * - Router navigation is mocked via useNavigate.
 * - React Query is wrapped with QueryClientProvider (retry:false).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import Dashboard from '../../../../pages/dashboard/Dashboard';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseDashboardMetrics = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../api/analytics/hooks', () => ({
  useDashboardMetrics: mockUseDashboardMetrics,
}));

vi.mock('../../../../pages/dashboard/blocks/MonthlyMovementMini', () => ({
  default: vi.fn(() => <div data-testid="monthly-movement">Monthly Movement Chart</div>),
}));

vi.mock('../../../../features/help', () => ({
  HelpIconButton: vi.fn(() => <button data-testid="help-button">Help</button>),
}));

/**
 * StatCard is a presentational child; we mock it to:
 * - assert that Dashboard passes the right titles (translation keys)
 * - surface the value/loading contracts in a deterministic DOM
 */
vi.mock('../../../../components/ui/StatCard', () => ({
  default: vi.fn(
    ({ title, value, loading }: { title: string; value?: number | null; loading?: boolean }) => (
      <div data-testid={`stat-card-${title}`}>
        {loading ? <div>Loading...</div> : <div>{value ?? '—'}</div>}
      </div>
    ),
  ),
}));

// -------------------------------------
// Helpers
// -------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderDashboard(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();

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

  describe('rendering', () => {
    it('renders title, KPI cards, monthly movement block, and help entry point', () => {
      renderDashboard(queryClient);

      expect(screen.getByText('dashboard.title')).toBeInTheDocument();

      // KPI cards (titles are translation keys passed into StatCard).
      expect(screen.getByTestId('stat-card-dashboard.kpi.totalItems')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-dashboard.kpi.suppliers')).toBeInTheDocument();
      expect(screen.getByTestId('stat-card-dashboard.kpi.lowStock')).toBeInTheDocument();

      // Other blocks.
      expect(screen.getByTestId('monthly-movement')).toBeInTheDocument();
      expect(screen.getByTestId('help-button')).toBeInTheDocument();
    });

    it('binds KPI values to metrics data', () => {
      renderDashboard(queryClient);

      // Values should be visible via mocked StatCard output.
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('renders primary action buttons', () => {
      renderDashboard(queryClient);

      expect(screen.getByText('dashboard.actions.manageInventory')).toBeInTheDocument();
      expect(screen.getByText('dashboard.actions.manageSuppliers')).toBeInTheDocument();
      expect(screen.getByText('dashboard.actions.viewAnalytics')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('navigates to Inventory when the manage inventory action is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard(queryClient);

      await user.click(screen.getByText('dashboard.actions.manageInventory'));
      expect(mockNavigate).toHaveBeenCalledWith('/inventory');
    });

    it('navigates to Suppliers when the manage suppliers action is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard(queryClient);

      await user.click(screen.getByText('dashboard.actions.manageSuppliers'));
      expect(mockNavigate).toHaveBeenCalledWith('/suppliers');
    });

    it('navigates to Analytics overview when view analytics is clicked', async () => {
      const user = userEvent.setup();
      renderDashboard(queryClient);

      await user.click(screen.getByText('dashboard.actions.viewAnalytics'));
      expect(mockNavigate).toHaveBeenCalledWith('/analytics/overview');
    });
  });

  describe('states', () => {
    it('shows a loading state for KPI cards while metrics are loading', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderDashboard(queryClient);

      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0);
    });

    it('shows em-dash placeholders when metric values are unavailable', () => {
      mockUseDashboardMetrics.mockReturnValue({
        data: { inventoryCount: null, suppliersCount: null, lowStockCount: null },
        isLoading: false,
        error: null,
      });

      renderDashboard(queryClient);

      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });
});
