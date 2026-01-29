/**
 * @file PriceTrendCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/price-trend/PriceTrendCard
 * @description
 * Enterprise tests for PriceTrendCard:
 * - Search scoping (supplier vs global)
 * - Fetch gating (no trend query until item selected)
 * - Chart states (initial skeleton, rendered chart, empty fallback)
 * - Supplier change resets selection
 */

import type { ReactNode, SyntheticEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AutocompleteProps, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';

import type { ItemRef, PricePoint } from '@/api/analytics';
import { getPriceTrend, searchItemsForSupplier, searchItemsGlobal } from '@/api/analytics';
import PriceTrendCard from '@/pages/analytics/blocks/price-trend/PriceTrendCard';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { dateFormat: 'MM/dd/yyyy', numberFormat: 'en-US' },
  }),
}));

vi.mock('@/hooks/useDebounced', () => ({
  useDebounced: <T,>(value: T) => value,
}));

const mockGetPriceTrend = vi.hoisted(() => vi.fn());
const mockSearchForSupplier = vi.hoisted(() => vi.fn());
const mockSearchGlobal = vi.hoisted(() => vi.fn());

vi.mock('@/api/analytics', () => ({
  getPriceTrend: mockGetPriceTrend,
  searchItemsForSupplier: mockSearchForSupplier,
  searchItemsGlobal: mockSearchGlobal,
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
}));

type CapturedAutocomplete = Pick<
  AutocompleteProps<ItemRef, false, false, false>,
  'onInputChange' | 'onChange' | 'options' | 'value'
>;

let ac: (CapturedAutocomplete & { options: ItemRef[]; value: ItemRef | null }) | null = null;

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    Autocomplete: (props: AutocompleteProps<ItemRef, false, false, false>) => {
      ac = {
        onInputChange: props.onInputChange,
        onChange: props.onChange,
        value: props.value ?? null,
        options: props.options ? [...props.options] : [],
      };

      return (
        <div data-testid="item-autocomplete">
          {props.renderInput?.(
            {
              id: 'mock-input',
              InputLabelProps: {},
              InputProps: {},
              inputProps: {},
              fullWidth: true,
            } as AutocompleteRenderInputParams,
          )}
        </div>
      );
    },
  };
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function setup(client: QueryClient, props: Partial<React.ComponentProps<typeof PriceTrendCard>> = {}) {
  return render(
    <QueryClientProvider client={client}>
      <PriceTrendCard {...props} />
    </QueryClientProvider>,
  );
}

async function waitForAutocomplete() {
  await waitFor(() => expect(ac).not.toBeNull());
}

function typeInAutocomplete(value: string) {
  act(() => {
    const e = {} as SyntheticEvent<Element, Event>;
    ac?.onInputChange?.(e, value, 'input');
  });
}

async function searchAndWaitOptions(term: string) {
  await waitForAutocomplete();
  typeInAutocomplete(term);
  await waitFor(() => expect((ac?.options.length ?? 0) > 0).toBe(true));
}

function pickFirstOption() {
  act(() => {
    const e = {} as SyntheticEvent<Element, Event>;
    ac?.onChange?.(e, ac?.options?.[0] ?? null, 'selectOption');
  });
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('PriceTrendCard', () => {
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    ac = null;
    client = createClient();

    vi.mocked(searchItemsForSupplier).mockResolvedValue([]);
    vi.mocked(searchItemsGlobal).mockResolvedValue([]);
  });

  it('renders initial UI shell and does not fetch price trend before selection', async () => {
    setup(client, { supplierId: 'sup-9', from: '2025-01-01', to: '2025-12-31' });
    await waitForAutocomplete();

    expect(screen.getByText('analytics:cards.priceTrend')).toBeInTheDocument();
    expect(screen.getByTestId('item-autocomplete')).toBeInTheDocument();
    expect(getPriceTrend).not.toHaveBeenCalled();
  });

  it('shows chart skeleton while no item is chosen', () => {
    const { container } = setup(client, { supplierId: 'sup-1' });
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('scopes item search to supplier when supplierId is present', async () => {
    vi.mocked(searchItemsForSupplier).mockResolvedValue([{ id: 'itm-1', name: 'Widget', supplierId: 'sup-1' }]);

    setup(client, { supplierId: 'sup-1' });

    await searchAndWaitOptions('Wid');

    await waitFor(() => expect(searchItemsForSupplier).toHaveBeenCalledWith('sup-1', 'Wid', 50));
    expect(searchItemsGlobal).not.toHaveBeenCalled();
  });

  it('fetches price trend after selecting an item and renders chart', async () => {
    const options: ItemRef[] = [{ id: 'itm-99', name: 'Item 99', supplierId: 'sup-1' }];
    const priceData: PricePoint[] = [
      { date: '2025-01-01', price: 10 },
      { date: '2025-01-02', price: 12 },
    ];

    vi.mocked(searchItemsForSupplier).mockResolvedValue(options);
    vi.mocked(getPriceTrend).mockResolvedValue(priceData);

    setup(client, { supplierId: 'sup-1', from: '2025-01-01', to: '2025-01-31' });

    await searchAndWaitOptions('Item');
    pickFirstOption();

    await waitFor(() =>
      expect(getPriceTrend).toHaveBeenCalledWith('itm-99', {
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-1',
      }),
    );

    await waitFor(() => expect(screen.getByTestId('line-chart')).toHaveAttribute('data-length', '2'));
  });

  it('shows empty chart message when no price data is returned', async () => {
    vi.mocked(searchItemsGlobal).mockResolvedValue([{ id: 'itm-5', name: 'Item 5' } as ItemRef]);
    vi.mocked(getPriceTrend).mockResolvedValue([]);

    setup(client, { supplierId: null });

    await searchAndWaitOptions('Item');
    pickFirstOption();

    await waitFor(() =>
      expect(getPriceTrend).toHaveBeenCalledWith('itm-5', {
        from: undefined,
        to: undefined,
        supplierId: undefined,
      }),
    );

    expect(await screen.findByText('No price data available')).toBeInTheDocument();
  });

  it('resets selected item when supplierId changes', async () => {
    vi.mocked(searchItemsForSupplier).mockResolvedValue([{ id: 'itm-7', name: 'Item 7', supplierId: 'sup-1' }]);

    const view = setup(client, { supplierId: 'sup-1' });

    await searchAndWaitOptions('Item');
    pickFirstOption();

    await waitFor(() => expect(ac?.value?.id).toBe('itm-7'));

    view.rerender(
      <QueryClientProvider client={client}>
        <PriceTrendCard supplierId="sup-2" />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(ac?.value).toBeNull());
  });
});
