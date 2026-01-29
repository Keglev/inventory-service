/**
 * @file Analytics.test.tsx
 * @module __tests__/components/pages/analytics/Analytics
 * @description
 * Enterprise tests for the Analytics page orchestration:
 * - Route-to-section mapping (overview/pricing/inventory/finance)
 * - Invalid section fallback to "overview"
 * - Filters shell always present
 * - Renders the correct block(s) for each section
 *
 * Notes:
 * - We mock all blocks + nav + filters to keep tests fast and focused on orchestration.
 * - We wrap in MemoryRouter + QueryClientProvider because the page depends on routing + react-query.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// -----------------------------------------------------------------------------
// Mocks (blocks + page-level dependencies)
// -----------------------------------------------------------------------------

vi.mock('@/pages/analytics/blocks/StockValueCard', () => ({
  default: () => <div data-testid="stock-value-card">StockValueCard</div>,
}));

vi.mock('@/pages/analytics/blocks/PriceTrendCard', () => ({
  default: () => <div data-testid="price-trend-card">PriceTrendCard</div>,
}));

vi.mock('@/pages/analytics/blocks/LowStockTable', () => ({
  default: () => <div data-testid="low-stock-table">LowStockTable</div>,
}));

vi.mock('@/pages/analytics/blocks/StockPerSupplierDonut', () => ({
  default: () => <div data-testid="stock-per-supplier-donut">StockPerSupplierDonut</div>,
}));

vi.mock('@/pages/analytics/blocks/FinancialSummaryCard', () => ({
  default: () => <div data-testid="financial-summary-card">FinancialSummaryCard</div>,
}));

vi.mock('@/pages/analytics/blocks/ItemUpdateFrequencyCard', () => ({
  default: () => <div data-testid="item-update-frequency-card">ItemUpdateFrequencyCard</div>,
}));

vi.mock('@/pages/analytics/blocks/RecentStockActivityCard', () => ({
  default: () => <div data-testid="recent-stock-activity-card">RecentStockActivityCard</div>,
}));

vi.mock('@/pages/analytics/blocks/MovementLineCard', () => ({
  default: () => <div data-testid="movement-line-card">MovementLineCard</div>,
}));

vi.mock('@/pages/analytics/components/AnalyticsNav', () => ({
  default: vi.fn(({ section }: { section: string }) => <div data-testid="analytics-nav">Nav: {section}</div>),
}));

vi.mock('@/pages/analytics/components/filters', () => ({
  Filters: vi.fn(() => <div data-testid="filters">Filters</div>),
}));

vi.mock('@/api/analytics/suppliers', () => ({
  getSuppliersLite: vi.fn(() => Promise.resolve([])),
}));

vi.mock('@/features/help', () => ({
  HelpIconButton: () => <div data-testid="help-icon-button">Help</div>,
}));

const Analytics = (await import('@/pages/analytics/Analytics')).default;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function setup(client: QueryClient, initialRoute = '/analytics') {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/analytics/:section?" element={<Analytics />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('Analytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('defaults to "overview" when no section is provided', () => {
    setup(queryClient, '/analytics');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('overview');
  });

  it('falls back to "overview" for an unknown section', () => {
    setup(queryClient, '/analytics/invalid');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('overview');
  });

  it('renders filters shell (always visible)', () => {
    setup(queryClient, '/analytics');
    expect(screen.getByTestId('filters')).toBeInTheDocument();
  });

  it('renders "pricing" section when route is /analytics/pricing', () => {
    setup(queryClient, '/analytics/pricing');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('pricing');
    expect(screen.getByTestId('price-trend-card')).toBeInTheDocument();
  });

  it('renders "inventory" section when route is /analytics/inventory', () => {
    setup(queryClient, '/analytics/inventory');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('inventory');
    expect(screen.getByTestId('low-stock-table')).toBeInTheDocument();
  });

  it('renders "finance" section when route is /analytics/finance', () => {
    setup(queryClient, '/analytics/finance');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('finance');
    expect(screen.getByTestId('financial-summary-card')).toBeInTheDocument();
  });

  it('renders stock value card in the "overview" section', () => {
    setup(queryClient, '/analytics/overview');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('overview');
    expect(screen.getByTestId('stock-value-card')).toBeInTheDocument();
  });
});
