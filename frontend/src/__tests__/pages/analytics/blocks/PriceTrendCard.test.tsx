/**
 * @file PriceTrendCard.test.tsx
 * @module __tests__/pages/analytics/blocks/PriceTrendCard
 * @description Supplier-aware item typeahead + price trend chart (A3).
 *
 * Contract under test:
 * - Chart fetch is gated on an explicit item selection; before it the card
 *   prompts for an item instead of showing a loading skeleton.
 * - The price line is drawn as steps (stepAfter): a price holds until it changes,
 *   so the last price is carried to the range end, without a dot on that day.
 * - The X axis is a time scale over the selected range: spacing follows time,
 *   not the number of price changes; points without a date are dropped.
 * - The price axis keeps at least a 10% margin with round ticks (steps of 1, 2
 *   or 5 times a power of ten, at least one cent); the line is named for the tooltip.
 * - Client-side option enrichment: supplier filter, text narrowing, and
 *   union of the selected item back into transiently missing options.
 * - Helper text: no-items message when a typed search finds nothing,
 *   type-to-search prompt before typing, blank without a supplier.
 * - Price series is sorted ascending by date before rendering; empty
 *   series shows the no-data state.
 * - Tooltip/axis formatters format via user preferences.
 *
 * Typeahead state/debounce live in useItemSearchOptions (own test, mocked
 * here); the Autocomplete markup lives in ItemSearchAutocomplete (own test).
 */
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { PricePoint } from '@/api/analytics/types';
import type { ItemRef } from '@/api/shared/types';
import { getPriceTrend } from '@/api/analytics/priceTrend';
import { useItemSearchOptions } from '@/pages/analytics/hooks/useItemSearchOptions';
import PriceTrendCard from '@/pages/analytics/blocks/PriceTrendCard';

// -----------------------------------------------------------------------------
// Captures
// -----------------------------------------------------------------------------

let lastChartData: PricePoint[] | null = null;
let lastXTickFormatter: ((v: string | number) => string) | null = null;
let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: string) => string) | null = null;
let lastPickerProps: Record<string, unknown> | null = null;
let lastLineType: string | null = null;
let lastLineName: string | null = null;
let lastYDomain: unknown = null;
let lastYTicks: number[] | null = null;
let lastXAxisProps: { type?: string; scale?: string; domain?: number[]; ticks?: number[] } | null = null;
let lastDot: ((props: { payload?: { carried?: boolean } }) => { type: unknown }) | null = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { dateFormat: 'DD.MM.YYYY', numberFormat: 'DE' },
  }),
}));

vi.mock('@/api/analytics/priceTrend', () => ({
  getPriceTrend: vi.fn(),
}));

vi.mock('@/pages/analytics/hooks/useItemSearchOptions', () => ({
  useItemSearchOptions: vi.fn(),
}));

vi.mock('@/pages/analytics/components/ItemSearchAutocomplete', () => ({
  ItemSearchAutocomplete: (props: Record<string, unknown>) => {
    lastPickerProps = props;
    return <div data-testid="picker" data-helper={String(props.helperText)} />;
  },
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: PricePoint[] }) => {
    lastChartData = Array.isArray(data) ? [...data] : [];
    return <div data-testid="line-chart">{children}</div>;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({
    tickFormatter,
    ...axis
  }: {
    tickFormatter?: (v: string | number) => string;
    type?: string;
    scale?: string;
    domain?: number[];
    ticks?: number[];
  }) => {
    lastXTickFormatter = tickFormatter ?? null;
    lastXAxisProps = axis;
    return <div data-testid="x-axis" />;
  },
  YAxis: ({
    tickFormatter,
    domain,
    ticks,
  }: {
    tickFormatter?: (v: string | number) => string;
    domain?: unknown;
    ticks?: number[];
  }) => {
    lastYTickFormatter = tickFormatter ?? null;
    lastYDomain = domain ?? null;
    lastYTicks = ticks ?? null;
    return <div data-testid="y-axis" />;
  },
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter?: (v: number | string) => string;
    labelFormatter?: (v: string) => string;
  }) => {
    lastTooltipFormatter = formatter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Line: ({ type, dot, name }: { type?: string; dot?: unknown; name?: string }) => {
    lastLineType = type ?? null;
    lastLineName = name ?? null;
    lastDot = typeof dot === 'function' ? (dot as typeof lastDot) : null;
    return <div data-testid="line" />;
  },
}));

const getPriceTrendMock = vi.mocked(getPriceTrend);
const useItemSearchOptionsMock = vi.mocked(useItemSearchOptions);

type ItemWithSupplier = ItemRef & { supplierId?: string | null };

function searchState(overrides: Partial<ReturnType<typeof useItemSearchOptions>> = {}) {
  return {
    itemQuery: '',
    setItemQuery: vi.fn(),
    debouncedQuery: '',
    selectedItem: null,
    setSelectedItem: vi.fn(),
    searchQuery: { data: [], isLoading: false },
    ...overrides,
  } as unknown as ReturnType<typeof useItemSearchOptions>;
}

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function setup(props: Partial<React.ComponentProps<typeof PriceTrendCard>> = {}) {
  return render(
    <QueryClientProvider client={createClient()}>
      <PriceTrendCard {...props} />
    </QueryClientProvider>
  );
}

const options: ItemWithSupplier[] = [
  { id: 'it-1', name: 'Blue Widget', supplierId: 'sup-1' },
  { id: 'it-2', name: 'Red Widget', supplierId: 'sup-2' },
  { id: 'it-3', name: 'Blue Bolt', supplierId: 'sup-1' },
];

describe('PriceTrendCard', () => {
  beforeEach(() => {
    getPriceTrendMock.mockReset();
    useItemSearchOptionsMock.mockReset();
    lastChartData = null;
    lastXTickFormatter = null;
    lastYTickFormatter = null;
    lastTooltipFormatter = null;
    lastTooltipLabelFormatter = null;
    lastPickerProps = null;
  });

  it('prompts for an item and never fetches the trend before one is selected', () => {
    useItemSearchOptionsMock.mockReturnValue(searchState());

    const { container } = setup({ supplierId: 'sup-1' });

    expect(screen.getByText('analytics:priceTrend.selectItem')).toBeInTheDocument();
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeInTheDocument();
    expect(getPriceTrendMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('filters options by supplier and narrows by the debounced query', () => {
    useItemSearchOptionsMock.mockReturnValue(
      searchState({
        debouncedQuery: 'widget',
        // The tagless entry exercises the (it.supplierId ?? '') guard.
        searchQuery: {
          data: [...options, { id: 'it-4', name: 'Tagless Widget' }],
          isLoading: false,
        } as never,
      })
    );

    setup({ supplierId: 'sup-1' });

    // sup-2 and the supplier-less entry filtered out, "Bolt" narrowed out.
    expect(lastPickerProps?.options).toEqual([options[0]]);
  });

  it('treats missing search data as an empty option list', () => {
    useItemSearchOptionsMock.mockReturnValue(
      searchState({ searchQuery: { data: undefined, isLoading: true } as never })
    );

    setup({ supplierId: 'sup-1' });

    expect(lastPickerProps?.options).toEqual([]);
    expect(lastPickerProps?.loading).toBe(true);
  });

  it('passes all options through when no supplier or query narrows them', () => {
    useItemSearchOptionsMock.mockReturnValue(
      searchState({ searchQuery: { data: options, isLoading: false } as never })
    );

    setup();

    expect(lastPickerProps?.options).toEqual(options);
  });

  it('unions the selected item back in when a refetch drops it from the options', () => {
    const selected: ItemWithSupplier = { id: 'it-9', name: 'Kept', supplierId: 'sup-1' };
    getPriceTrendMock.mockResolvedValue([]);
    useItemSearchOptionsMock.mockReturnValue(
      searchState({
        selectedItem: selected,
        searchQuery: { data: options, isLoading: false } as never,
      })
    );

    setup({ supplierId: 'sup-1' });

    const opts = lastPickerProps?.options as ItemWithSupplier[];
    expect(opts[0]).toEqual(selected);
  });

  it('messages a typed search that found nothing for the supplier', () => {
    useItemSearchOptionsMock.mockReturnValue(
      searchState({ debouncedQuery: 'zzz', searchQuery: { data: [], isLoading: false } as never })
    );

    setup({ supplierId: 'sup-1' });

    expect(screen.getByTestId('picker')).toHaveAttribute(
      'data-helper',
      'analytics:priceTrend.noItemsForSupplier'
    );
  });

  it('prompts to type before any query is entered', () => {
    useItemSearchOptionsMock.mockReturnValue(searchState());

    setup({ supplierId: 'sup-1' });

    expect(screen.getByTestId('picker')).toHaveAttribute(
      'data-helper',
      'analytics:priceTrend.typeToSearch'
    );
  });

  it('keeps the helper line blank without a supplier', () => {
    useItemSearchOptionsMock.mockReturnValue(searchState());

    setup();

    expect(screen.getByTestId('picker')).toHaveAttribute('data-helper', ' ');
  });

  it('shows the no-data state when the selected item has no price points', async () => {
    getPriceTrendMock.mockResolvedValue([]);
    useItemSearchOptionsMock.mockReturnValue(
      searchState({ selectedItem: options[0] })
    );

    setup({ supplierId: 'sup-1' });

    await waitFor(() =>
      expect(screen.getByText('analytics:cards.noData')).toBeInTheDocument()
    );
  });

  it('fetches, sorts the series by date, and formats values via preferences', async () => {
    const points = [
      { date: '2026-06-01', price: 3 },
      { date: '2026-05-01', price: 2.5 },
    ] as PricePoint[];
    getPriceTrendMock.mockResolvedValue(points);
    useItemSearchOptionsMock.mockReturnValue(
      searchState({ selectedItem: options[0] })
    );

    setup({ supplierId: 'sup-1', from: '2026-05-01', to: '2026-06-30' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());

    expect(getPriceTrendMock).toHaveBeenCalledWith('it-1', {
      from: '2026-05-01',
      to: '2026-06-30',
      supplierId: 'sup-1',
    });
    // Sorted ascending; the last price is carried to the range end (2026-06-30).
    expect(lastChartData?.map((p) => p.date)).toEqual(['2026-05-01', '2026-06-01', '2026-06-30']);
    // DE format with two decimals; non-numeric tooltip values pass through.
    expect(lastYTickFormatter?.(1234.5)).toBe('1.234,50');
    expect(lastTooltipFormatter?.(2.5)).toBe('2,50 €');
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
    // Date labels format parseable dates and fall back to the raw string.
    expect(lastXTickFormatter?.('2026-05-01')).toBe('01.05.2026');
    expect(lastTooltipLabelFormatter?.('not-a-date')).toBe('not-a-date');
  });

  it('draws the price as steps between changes', async () => {
    getPriceTrendMock.mockResolvedValue([{ date: '2026-05-01', price: 2.5 }] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastLineType).toBe('stepAfter');
  });

  it('carries the last price to the range end without a dot', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2026-05-01', price: 2.5 },
      { date: '2026-06-01', price: 3 },
    ] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', from: '2026-05-01', to: '2026-06-30' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastChartData?.at(-1)).toEqual({ date: '2026-06-30', price: 3, t: Date.parse('2026-06-30'), carried: true });
    expect(lastDot?.({ payload: { carried: true } }).type).toBe('g');
    expect(lastDot?.({ payload: {} }).type).toBe('circle');
  });

  it('adds no carried point when the last change falls on the range end', async () => {
    getPriceTrendMock.mockResolvedValue([{ date: '2026-06-30', price: 3 }] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', from: '2026-05-01', to: '2026-06-30' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastChartData).toEqual([{ date: '2026-06-30', price: 3, t: Date.parse('2026-06-30') }]);
  });

  it('places points on a time scale over the selected range', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2026-05-06', price: 16.4 },
      { date: '2026-07-07', price: 16.8 },
    ] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', from: '2026-04-16', to: '2026-10-12' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastXAxisProps).toMatchObject({ type: 'number', scale: 'time' });
    expect(lastXAxisProps?.domain).toEqual([Date.parse('2026-04-16'), Date.parse('2026-10-12')]);
    const ticks = lastXAxisProps?.ticks ?? [];
    expect(ticks).toHaveLength(6);
    expect([ticks[0], ticks.at(-1)]).toEqual([Date.parse('2026-04-16'), Date.parse('2026-10-12')]);
    expect(ticks.every((t) => t % 86_400_000 === 0)).toBe(true);
    // Time-scale ticks arrive as epoch ms and format as dates.
    expect(lastXTickFormatter?.(Date.parse('2026-05-01'))).toBe('01.05.2026');
  });

  it('widens the price axis to round ticks around the prices and names the series', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2026-05-06', price: 16.4 },
      { date: '2026-07-07', price: 16.8 },
    ] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', to: '2026-07-07' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastYDomain).toEqual([16.2, 17]);
    expect(lastYTicks).toEqual([16.2, 16.4, 16.6, 16.8, 17]);
    expect(lastLineName).toBe('analytics:cards.priceSeries');
  });

  it('gives a flat price a margin of 5% of the price', async () => {
    getPriceTrendMock.mockResolvedValue([{ date: '2026-05-06', price: 3 }] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', to: '2026-07-07' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastYDomain).toEqual([2.8, 3.2]);
    expect(lastYTicks).toEqual([2.8, 2.9, 3, 3.1, 3.2]);
  });

  it('steps ticks by 1, 2 or 5 times a power of ten, never 2.5', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2026-05-06', price: 0.12 },
      { date: '2026-07-07', price: 0.19 },
    ] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', to: '2026-07-07' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    // A 2.5 step would give 0.125, which a two-decimal label shows as 0,13.
    expect(lastYTicks).toEqual([0.1, 0.15, 0.2]);
  });

  it('never ticks finer than one cent', async () => {
    getPriceTrendMock.mockResolvedValue([
      { date: '2026-05-06', price: 30 },
      { date: '2026-07-07', price: 30.01 },
    ] as PricePoint[]);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup({ supplierId: 'sup-1', to: '2026-07-07' });

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());
    expect(lastYTicks).toEqual([29.99, 30, 30.01, 30.02]);
  });

  it('drops points without a date and omits the supplier param without one', async () => {
    const points = [
      { date: '2026-05-01', price: 2.5 },
      { price: 3 },
    ] as PricePoint[];
    getPriceTrendMock.mockResolvedValue(points);
    useItemSearchOptionsMock.mockReturnValue(searchState({ selectedItem: options[0] }));

    setup();

    await waitFor(() => expect(screen.getByTestId('line-chart')).toBeInTheDocument());

    expect(getPriceTrendMock).toHaveBeenCalledWith('it-1', {
      from: undefined,
      to: undefined,
      supplierId: undefined,
    });
    // A point without a date has no place on the time axis.
    expect(lastChartData?.map((p) => p.date)).toEqual(['2026-05-01']);
  });
});
