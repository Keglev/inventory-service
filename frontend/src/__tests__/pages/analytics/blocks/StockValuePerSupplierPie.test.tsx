/**
 * @file StockValuePerSupplierPie.test.tsx
 * @module __tests__/pages/analytics/blocks/StockValuePerSupplierPie
 * @description
 * The stock value pie: loading skeleton, empty helper, one named slice per
 * top supplier plus a grey "all others" slice, a legend in rank order, and a
 * tooltip with the value in euros and the share. The grouping rule itself is
 * covered by its sibling, supplierValueSlices.test.ts.
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockPerSupplierPoint } from '@/api/analytics/types';
import { getStockPerSupplier } from '@/api/analytics/stock';
import StockValuePerSupplierPie from '@/pages/analytics/blocks/StockValuePerSupplierPie';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ userPreferences: { numberFormat: 'EN_US' } }),
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: { main: '#4472C4' },
        success: { main: '#70AD47' },
        info: { main: '#5B9BD5' },
        warning: { main: '#FFC000' },
        grey: { 500: '#9E9E9E' },
        background: { paper: '#111111' },
        divider: '#333333',
        text: { primary: '#eeeeee' },
      },
    }),
  };
});

type Slice = { name: string; value: number };
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastLegendSorter: ((item: { value: string }) => number | string) | null = null;

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data, innerRadius }: { children?: ReactNode; data: Slice[]; innerRadius?: unknown }) => (
    <div data-testid="pie" data-inner={String(innerRadius ?? 'none')}>
      {data.map((d) => (
        <span key={d.name} data-testid="slice-name">{d.name}</span>
      ))}
      {children}
    </div>
  ),
  Tooltip: ({ formatter }: { formatter?: (v: number | string) => string }) => {
    lastTooltipFormatter = formatter ?? null;
    return null;
  },
  Legend: ({ itemSorter }: { itemSorter?: (item: { value: string }) => number | string }) => {
    lastLegendSorter = itemSorter ?? null;
    return <div data-testid="legend" />;
  },
  Cell: ({ fill }: { fill?: string }) => <div data-testid="pie-cell" data-fill={fill} />,
}));

vi.mock('@/api/analytics/stock', () => ({
  getStockPerSupplier: vi.fn(),
}));

function point(supplierName: string, totalValue: number): StockPerSupplierPoint {
  return { supplierName, totalQuantity: 1, totalValue };
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StockValuePerSupplierPie />
    </QueryClientProvider>,
  );
}

describe('StockValuePerSupplierPie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastTooltipFormatter = null;
    lastLegendSorter = null;
  });

  it('renders the loading skeleton while the query is in flight', () => {
    vi.mocked(getStockPerSupplier).mockReturnValue(new Promise(() => {}) as Promise<StockPerSupplierPoint[]>);

    const { container } = setup();

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows the empty helper when no supplier holds any value', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([point('Idle Supplier', 0)]);

    setup();

    expect(await screen.findByText('No supplier data for the current filters.')).toBeInTheDocument();
  });

  it('renders the value title and a full pie rather than a ring', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 10)]);

    setup();

    expect(await screen.findByTestId('pie')).toHaveAttribute('data-inner', 'none');
    expect(screen.getByText('Stock value per supplier (€)')).toBeInTheDocument();
  });

  it('names the top four and colours the grouped slice grey when there are six suppliers', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([
      point('Alpha', 600), point('Beta', 500), point('Gamma', 400),
      point('Delta', 300), point('Epsilon', 200), point('Zeta', 100),
    ]);

    setup();

    await waitFor(() => expect(screen.getAllByTestId('slice-name')).toHaveLength(5));
    expect(screen.getAllByTestId('slice-name').map((s) => s.textContent)).toEqual([
      'Alpha', 'Beta', 'Gamma', 'Delta', 'All others (2 suppliers)',
    ]);
    expect(screen.getAllByTestId('pie-cell').map((c) => c.getAttribute('data-fill'))).toEqual([
      '#4472C4', '#70AD47', '#5B9BD5', '#FFC000', '#9E9E9E',
    ]);
  });

  it('orders the legend by rank with the grouped slice last when the labels sort otherwise', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([
      point('Zeta', 600), point('Epsilon', 500), point('Delta', 400),
      point('Beta', 300), point('Alpha', 200), point('Aaron', 100),
    ]);

    setup();

    await waitFor(() => expect(lastLegendSorter).not.toBeNull());
    const alphabetical = ['All others (2 suppliers)', 'Beta', 'Delta', 'Epsilon', 'Zeta'];
    const ranked = [...alphabetical].sort(
      (a, b) => Number(lastLegendSorter?.({ value: a })) - Number(lastLegendSorter?.({ value: b })),
    );
    expect(ranked).toEqual(['Zeta', 'Epsilon', 'Delta', 'Beta', 'All others (2 suppliers)']);
  });

  it('formats the tooltip as euros and a share of the total', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 750), point('Beta', 250)]);

    setup();

    await waitFor(() => expect(lastTooltipFormatter).not.toBeNull());
    expect(lastTooltipFormatter?.(750)).toBe('750.00 € · 75.0 %');
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
  });
});
