/**
 * @file PriceTrendCard.test.tsx
 * @module __tests__/pages/analytics/PriceTrendCard
 * 
 * @summary
 * Tests for PriceTrendCard component.
 * Tests item selection, price chart rendering, and supplier scoping.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../../api/analytics', () => ({
  getPriceTrend: vi.fn(),
}));

vi.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('../../../../pages/analytics/blocks/price-trend/ItemAutocomplete', () => ({
  ItemAutocomplete: vi.fn(({ onChange }) => (
    <div data-testid="item-autocomplete">
      <button onClick={() => onChange({ id: 'item-1', name: 'Test Item' })}>
        Select Item
      </button>
    </div>
  )),
}));

vi.mock('../../../../pages/analytics/blocks/price-trend/PriceChart', () => ({
  PriceChart: vi.fn(({ data, isLoading }) => (
    <div data-testid="price-chart">
      {isLoading ? 'Loading...' : `Chart with ${data.length} points`}
    </div>
  )),
}));

const { getPriceTrend } = await import('../../../../api/analytics');
const PriceTrendCard = (await import('../../../../pages/analytics/blocks/price-trend/PriceTrendCard')).default;

describe('PriceTrendCard', () => {
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
        <PriceTrendCard {...props} />
      </QueryClientProvider>
    );
  };

  it('renders title', () => {
    renderCard();
    expect(screen.getByText('analytics:cards.priceTrend')).toBeInTheDocument();
  });

  it('renders ItemAutocomplete component', () => {
    renderCard();
    expect(screen.getByTestId('item-autocomplete')).toBeInTheDocument();
  });

  it('renders PriceChart component', () => {
    renderCard();
    expect(screen.getByTestId('price-chart')).toBeInTheDocument();
  });

  it('does not fetch price data initially without item selection', () => {
    renderCard({ from: '2025-01-01', to: '2025-12-31' });
    expect(getPriceTrend).not.toHaveBeenCalled();
  });

  it('shows loading state in chart initially', () => {
    renderCard();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with from and to props', () => {
    renderCard({ from: '2025-01-01', to: '2025-12-31' });
    expect(screen.getByTestId('item-autocomplete')).toBeInTheDocument();
  });

  it('renders with supplierId prop', () => {
    renderCard({ supplierId: 'sup-123' });
    expect(screen.getByTestId('item-autocomplete')).toBeInTheDocument();
  });

  it('passes correct props to ItemAutocomplete', async () => {
    const { ItemAutocomplete } = await import('../../../../pages/analytics/blocks/price-trend/ItemAutocomplete');
    renderCard({ supplierId: 'sup-123' });
    
    const calls = vi.mocked(ItemAutocomplete).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0]).toMatchObject({
      value: null,
      supplierId: 'sup-123',
    });
  });

  it('resets selected item when supplier changes', async () => {
    const { ItemAutocomplete } = await import('../../../../pages/analytics/blocks/price-trend/ItemAutocomplete');
    const { rerender } = renderCard({ supplierId: 'sup-1' });

    // Simulate item selection
    const selectButton = screen.getByText('Select Item');
    selectButton.click();

    rerender(
      <QueryClientProvider client={queryClient}>
        <PriceTrendCard supplierId="sup-2" />
      </QueryClientProvider>
    );

    // After supplier change, value should be reset to null
    const calls = vi.mocked(ItemAutocomplete).mock.calls;
    const lastCall = calls[calls.length - 1];
    expect(lastCall[0].value).toBeNull();
  });
});
