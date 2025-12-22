/**
 * @file Analytics.test.tsx
 * @module __tests__/pages/analytics/Analytics
 * 
 * @summary
 * Tests for Analytics page component.
 * Tests navigation, filter integration, and block orchestration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock all block components
vi.mock('../../../../pages/analytics/blocks/StockValueCard', () => ({
  default: () => <div data-testid="stock-value-card">StockValueCard</div>,
}));

vi.mock('../../../../pages/analytics/blocks/PriceTrendCard', () => ({
  default: () => <div data-testid="price-trend-card">PriceTrendCard</div>,
}));

vi.mock('../../../../pages/analytics/blocks/LowStockTable', () => ({
  default: () => <div data-testid="low-stock-table">LowStockTable</div>,
}));

vi.mock('../../../../pages/analytics/blocks/StockPerSupplierDonut', () => ({
  default: () => <div data-testid="stock-per-supplier-donut">StockPerSupplierDonut</div>,
}));

vi.mock('../../../../pages/analytics/blocks/FinancialSummaryCard', () => ({
  default: () => <div data-testid="financial-summary-card">FinancialSummaryCard</div>,
}));

vi.mock('../../../../pages/analytics/blocks/ItemUpdateFrequencyCard', () => ({
  default: () => <div data-testid="item-update-frequency-card">ItemUpdateFrequencyCard</div>,
}));

vi.mock('../../../../pages/analytics/blocks/RecentStockActivityCard', () => ({
  default: () => <div data-testid="recent-stock-activity-card">RecentStockActivityCard</div>,
}));

vi.mock('../../../../pages/analytics/blocks/MovementLineCard', () => ({
  default: () => <div data-testid="movement-line-card">MovementLineCard</div>,
}));

vi.mock('../../../../pages/analytics/components/AnalyticsNav', () => ({
  default: vi.fn(({ section }) => <div data-testid="analytics-nav">Nav: {section}</div>),
}));

vi.mock('../../../../pages/analytics/components/filters', () => ({
  Filters: vi.fn(() => <div data-testid="filters">Filters</div>),
}));

vi.mock('../../../../api/analytics/suppliers', () => ({
  getSuppliersLite: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../../../features/help', () => ({
  HelpIconButton: () => <div data-testid="help-icon-button">Help</div>,
}));

const Analytics = (await import('../../../../pages/analytics/Analytics')).default;

describe('Analytics', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderAnalytics = (initialRoute = '/analytics') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/analytics/:section?" element={<Analytics />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('renders overview section by default', () => {
    renderAnalytics('/analytics');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('overview');
  });

  it('renders pricing section when route is /analytics/pricing', () => {
    renderAnalytics('/analytics/pricing');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('pricing');
  });

  it('renders inventory section when route is /analytics/inventory', () => {
    renderAnalytics('/analytics/inventory');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('inventory');
  });

  it('renders finance section when route is /analytics/finance', () => {
    renderAnalytics('/analytics/finance');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('finance');
  });

  it('renders filters component', () => {
    renderAnalytics();
    expect(screen.getByTestId('filters')).toBeInTheDocument();
  });

  it('defaults to overview for invalid section', () => {
    renderAnalytics('/analytics/invalid');
    expect(screen.getByTestId('analytics-nav')).toHaveTextContent('overview');
  });

  it('shows stock value card in overview section', () => {
    renderAnalytics('/analytics/overview');
    expect(screen.getByTestId('stock-value-card')).toBeInTheDocument();
  });

  it('shows price trend card in pricing section', () => {
    renderAnalytics('/analytics/pricing');
    expect(screen.getByTestId('price-trend-card')).toBeInTheDocument();
  });

  it('shows low stock table in inventory section', () => {
    renderAnalytics('/analytics/inventory');
    expect(screen.getByTestId('low-stock-table')).toBeInTheDocument();
  });

  it('shows financial summary card in finance section', () => {
    renderAnalytics('/analytics/finance');
    expect(screen.getByTestId('financial-summary-card')).toBeInTheDocument();
  });
});
