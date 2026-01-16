/**
 * @file PriceTrendCard.test.tsx
 * @module __tests__/pages/analytics/PriceTrendCard
 *
 * @summary
 * Tests for PriceTrendCard component covering item search, supplier scoping, and chart states.
 */

import type { ReactNode, SyntheticEvent } from 'react';
import { act } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AutocompleteProps, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { ItemRef, PricePoint } from '@/api/analytics';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('@/hooks/useDebounced', () => ({
  useDebounced: <T,>(value: T) => value,
}));

vi.mock('@/api/analytics', () => ({
  getPriceTrend: vi.fn(),
  searchItemsForSupplier: vi.fn(),
  searchItemsGlobal: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-length={Array.isArray(data) ? data.length : 0}>{children}</div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Line: () => <div data-testid="line" />,
}));

type StoredAutocompleteHandlers = Pick<
  AutocompleteProps<ItemRef, false, false, false>,
  'onInputChange' | 'onChange' | 'renderInput' | 'options' | 'value'
>;

let latestAutocompleteProps: (StoredAutocompleteHandlers & { options: ItemRef[]; value: ItemRef | null }) | null = null;

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    Autocomplete: (props: AutocompleteProps<ItemRef, false, false, false>) => {
      latestAutocompleteProps = {
        onInputChange: props.onInputChange,
        onChange: props.onChange,
        renderInput: props.renderInput,
        value: props.value ?? null,
        options: props.options ? [...props.options] : [],
      };
      return (
        <div data-testid="item-autocomplete">
          {props.renderInput?.({
            id: 'mock-input',
            InputLabelProps: {},
            InputProps: {},
            inputProps: {},
            fullWidth: true,
          } as AutocompleteRenderInputParams)}
        </div>
      );
    },
  };
});

const { getPriceTrend, searchItemsForSupplier, searchItemsGlobal } = await import('@/api/analytics');
const PriceTrendCard = (await import('@/pages/analytics/blocks/price-trend/PriceTrendCard')).default;

const mockedGetPriceTrend = getPriceTrend as MockedFunction<typeof getPriceTrend>;
const mockedSearchItemsForSupplier = searchItemsForSupplier as MockedFunction<typeof searchItemsForSupplier>;
const mockedSearchItemsGlobal = searchItemsGlobal as MockedFunction<typeof searchItemsGlobal>;

function triggerAutocompleteInput(value: string) {
  act(() => {
    const event = {} as SyntheticEvent<Element, Event>;
    latestAutocompleteProps?.onInputChange?.(event, value, 'input');
  });
}

function selectAutocompleteOption(option: ItemRef | null) {
  act(() => {
    const event = {} as SyntheticEvent<Element, Event>;
    latestAutocompleteProps?.onChange?.(event, option, 'selectOption');
  });
}

describe('PriceTrendCard', () => {
  let queryClient: QueryClient;

  const renderCard = (props: Partial<React.ComponentProps<typeof PriceTrendCard>> = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <PriceTrendCard {...props} />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    latestAutocompleteProps = null;
    vi.clearAllMocks();
    mockedSearchItemsForSupplier.mockResolvedValue([]);
    mockedSearchItemsGlobal.mockResolvedValue([]);
  });

  it('renders title and autocomplete shell', () => {
    renderCard({ supplierId: null, from: undefined, to: undefined });
    expect(screen.getByText('analytics:cards.priceTrend')).toBeInTheDocument();
    expect(screen.getByTestId('item-autocomplete')).toBeInTheDocument();
  });

  it('does not fetch price data until an item is selected', () => {
    renderCard({ supplierId: 'sup-9', from: '2025-01-01', to: '2025-12-31' });
    expect(mockedGetPriceTrend).not.toHaveBeenCalled();
  });

  it('shows chart skeleton while no item is chosen', () => {
    renderCard({ supplierId: 'sup-1' });
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('searches items scoped to the supplier when typing', async () => {
    mockedSearchItemsForSupplier.mockResolvedValue([
      { id: 'itm-1', name: 'Widget', supplierId: 'sup-1' },
    ]);

    renderCard({ supplierId: 'sup-1', from: undefined, to: undefined });

    await waitFor(() => expect(latestAutocompleteProps).not.toBeNull());
    triggerAutocompleteInput('Wid');

    await waitFor(() => {
      expect(mockedSearchItemsForSupplier).toHaveBeenCalledWith('sup-1', 'Wid', 50);
    });

    expect(mockedSearchItemsGlobal).not.toHaveBeenCalled();
  });

  it('fetches price trend after selecting an item', async () => {
    const mockOptions: ItemRef[] = [{ id: 'itm-99', name: 'Item 99', supplierId: 'sup-1' }];
    const mockPriceData: PricePoint[] = [
      { date: '2025-01-01', price: 10 },
      { date: '2025-01-02', price: 12 },
    ];

    mockedSearchItemsForSupplier.mockResolvedValue(mockOptions);
    mockedGetPriceTrend.mockResolvedValue(mockPriceData);

    renderCard({ supplierId: 'sup-1', from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => latestAutocompleteProps !== null);
    triggerAutocompleteInput('Item');

    await waitFor(() => {
      expect(latestAutocompleteProps?.options.length ?? 0).toBeGreaterThan(0);
    });

    const firstOption = latestAutocompleteProps?.options[0] ?? null;
    selectAutocompleteOption(firstOption);

    await waitFor(() => {
      expect(mockedGetPriceTrend).toHaveBeenCalledWith('itm-99', {
        from: '2025-01-01',
        to: '2025-01-31',
        supplierId: 'sup-1',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toHaveAttribute('data-length', '2');
    });
  });

  it('shows empty chart message when no price data is returned', async () => {
    const mockOptions: ItemRef[] = [{ id: 'itm-5', name: 'Item 5' }];
    mockedSearchItemsGlobal.mockResolvedValue(mockOptions);
    mockedGetPriceTrend.mockResolvedValue([]);

    renderCard({ supplierId: null });

    await waitFor(() => latestAutocompleteProps !== null);
    triggerAutocompleteInput('Item');

    await waitFor(() => {
      expect(latestAutocompleteProps?.options.length ?? 0).toBeGreaterThan(0);
    });

    const firstOption = latestAutocompleteProps?.options[0] ?? null;
    selectAutocompleteOption(firstOption);

    await waitFor(() => {
      expect(mockedGetPriceTrend).toHaveBeenCalledWith('itm-5', {
        from: undefined,
        to: undefined,
        supplierId: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.getByText('No price data available')).toBeInTheDocument();
    });
  });

  it('resets selected item when supplier changes', async () => {
    const option: ItemRef[] = [{ id: 'itm-7', name: 'Item 7', supplierId: 'sup-1' }];
    mockedSearchItemsForSupplier.mockResolvedValue(option);

    const view = renderCard({ supplierId: 'sup-1' });

    await waitFor(() => latestAutocompleteProps !== null);
    triggerAutocompleteInput('Item');

    await waitFor(() => (latestAutocompleteProps?.options.length ?? 0) > 0);
    selectAutocompleteOption(option[0]);

    await waitFor(() => latestAutocompleteProps?.value?.id === 'itm-7');

    view.rerender(
      <QueryClientProvider client={queryClient}>
        <PriceTrendCard supplierId="sup-2" />
      </QueryClientProvider>
    );

    await waitFor(() => latestAutocompleteProps !== null && latestAutocompleteProps.value === null);
  });
});
