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
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/__tests__/test/queryClient';

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
        action: { selected: 'rgba(255, 255, 255, 0.16)' },
      },
    }),
  };
});

type Slice = { name: string; value: number; fill?: string };
type ReadoutProps = { active?: boolean; payload?: Array<{ name?: string; value?: unknown }> };
type TooltipProps = { content?: (p: ReadoutProps) => ReactNode; position?: { x?: number; y?: number }; trigger?: string };
let lastTooltip: TooltipProps | null = null;
let lastLegendSorter: ((item: { value: string }) => number | string) | null = null;
let lastLegend: Record<string, unknown> | null = null;

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children?: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children, data, innerRadius }: { children?: ReactNode; data: Slice[]; innerRadius?: unknown }) => (
    <div data-testid="pie" data-inner={String(innerRadius ?? 'none')}>
      {data.map((d) => (
        <span key={d.name} data-testid="slice-name">{d.name}</span>
      ))}
      {/* Each slice's colour travels in its data entry (`fill`), as Recharts reads it. */}
      {data.map((d) => (
        <div key={`fill-${d.name}`} data-testid="pie-cell" data-fill={d.fill} />
      ))}
      {children}
    </div>
  ),
  Tooltip: (props: TooltipProps) => {
    lastTooltip = props;
    return null;
  },
  Legend: (props: { itemSorter?: (item: { value: string }) => number | string } & Record<string, unknown>) => {
    lastLegendSorter = props.itemSorter ?? null;
    lastLegend = props;
    return <div data-testid="legend" />;
  },
}));

vi.mock('@/api/analytics/stock', () => ({
  getStockPerSupplier: vi.fn(),
}));

function point(supplierName: string, totalValue: number): StockPerSupplierPoint {
  return { supplierName, totalQuantity: 1, totalValue };
}

function setup(props: React.ComponentProps<typeof StockValuePerSupplierPie> = {}) {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <StockValuePerSupplierPie {...props} />
    </QueryClientProvider>,
  );
}

describe('StockValuePerSupplierPie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastTooltip = null;
    lastLegendSorter = null;
    lastLegend = null;
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

  it('reads out the slice name over its euros and share of the total', async () => {
    vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 750), point('Beta', 250)]);

    setup();

    await waitFor(() => expect(lastTooltip?.content).toBeDefined());
    const { container } = render(<>{lastTooltip?.content?.({ active: true, payload: [{ name: 'Alpha', value: 750 }] })}</>);
    const lines = [...container.querySelectorAll('p')].map((el) => el.textContent);
    expect(lines).toEqual(['Alpha', '750.00 € · 75.0 %']);
    expect(lastTooltip?.content?.({ active: false, payload: [{ name: 'Alpha', value: 750 }] })).toBeNull();
    expect(lastTooltip?.content?.({ active: true, payload: [{ name: 'Alpha', value: 'n/a' }] })).toBeNull();
  });

  // The tooltip followed the cursor and covered up to 62% of the pie (C7).
  describe('pinned readout', () => {
    const widthSpy = (px: number) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(px);
    afterEach(() => vi.restoreAllMocks());

    it('pins the readout in a band above the pie on a narrow chart, legend below', async () => {
      widthSpy(320);
      vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 750), point('Beta', 250)]);

      setup();

      await waitFor(() => expect(lastTooltip?.position).toEqual({ x: 0, y: 0 }));
      expect(lastLegend).not.toHaveProperty('layout');
    });

    it('pins the readout at the foot of a legend column on a wide chart', async () => {
      widthSpy(700);
      vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 750), point('Beta', 250)]);

      setup();

      // Default chart height 260 minus the 54px readout and a 5px edge.
      await waitFor(() => expect(lastTooltip?.position).toEqual({ x: 0, y: 201 }));
      expect(lastLegend).toMatchObject({ layout: 'vertical', align: 'left', verticalAlign: 'top' });
    });

    // A tap never selected the tapped slice; touch screens open the readout on tap.
    it('opens the readout on tap on a screen without hover and on hover otherwise', async () => {
      vi.mocked(getStockPerSupplier).mockResolvedValue([point('Alpha', 750)]);
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query === '(hover: none)', media: query, onchange: null,
        addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
      })) as typeof window.matchMedia;
      try {
        const { unmount } = setup();
        await waitFor(() => expect(lastTooltip?.trigger).toBe('click'));
        unmount();
      } finally {
        window.matchMedia = original;
      }

      setup();
      await waitFor(() => expect(lastTooltip?.trigger).toBe('hover'));
    });
  });

  it('notes the current snapshot only when asked, as on Analytik under the date filter', () => {
    const { unmount } = setup();
    expect(screen.queryByTestId('date-scope-note')).not.toBeInTheDocument();
    unmount();
    setup({ dateScopeNote: true });
    expect(screen.getByTestId('date-scope-note')).toHaveTextContent('Current stock – not limited by the date range');
  });

});
