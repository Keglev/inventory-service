/**
 * @file ItemUpdateFrequencyCard.test.tsx
 * @module __tests__/components/pages/analytics/blocks/ItemUpdateFrequencyCard
 * @description
 * Enterprise tests for ItemUpdateFrequencyCard:
 * - Supplier requirement gate (no fetch without supplier)
 * - Loading state
 * - Chart rendering when data resolves
 * - Verifies supplierId is passed to the API
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { ItemUpdateFrequencyPoint } from '@/api/analytics/frequency';
import { getItemUpdateFrequency } from '@/api/analytics/frequency';
import ItemUpdateFrequencyCard from '@/pages/analytics/blocks/ItemUpdateFrequencyCard';
import { tEn } from '../../../../test/i18nEn';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children?: ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-length={Array.isArray(data) ? data.length : 0}>
      {children}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastXTickFormatter = tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  },
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ formatter }: { formatter?: (v: number | string) => string }) => {
    lastTooltipFormatter = formatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Bar: ({ children }: { children?: ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: ({ fill }: { fill?: string }) => <div data-testid="bar-cell" data-fill={fill} />,
}));

let lastXTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;

vi.mock('@/api/analytics/frequency', () => ({
  getItemUpdateFrequency: vi.fn(),
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function setup(client: QueryClient, supplierId?: string | null) {
  return render(
    <QueryClientProvider client={client}>
      <ItemUpdateFrequencyCard supplierId={supplierId} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('ItemUpdateFrequencyCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders empty state when supplier is not selected and does not fetch', () => {
    setup(queryClient, null);

    expect(screen.getByText('Select a supplier to view')).toBeInTheDocument();
    expect(getItemUpdateFrequency).not.toHaveBeenCalled();
  });

  it('shows loading skeleton while fetching', () => {
    vi.mocked(getItemUpdateFrequency).mockReturnValue(
      new Promise(() => {}) as Promise<ItemUpdateFrequencyPoint[]>,
    );

    const { container } = setup(queryClient, 'sup-123');

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders bar chart when data resolves', async () => {
    const mockData: ItemUpdateFrequencyPoint[] = [
      { id: 'a', name: 'Item A', updates: 12 },
      { id: 'b', name: 'Item B', updates: 8 },
      { id: 'c', name: 'Item C', updates: 5 },
    ];

    vi.mocked(getItemUpdateFrequency).mockResolvedValue(mockData);

    setup(queryClient, 'sup-123');

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '3');
    });

    // One cell per bar item.
    expect(screen.getAllByTestId('bar-cell')).toHaveLength(mockData.length);
  });

  it('requests data for the provided supplier', async () => {
    vi.mocked(getItemUpdateFrequency).mockResolvedValue([]);

    setup(queryClient, 'supplier-42');

    await waitFor(() => {
      expect(getItemUpdateFrequency).toHaveBeenCalledWith('supplier-42');
    });
  });

  it('formats axis counts and tooltip values, passing strings through', async () => {
    vi.mocked(getItemUpdateFrequency).mockResolvedValue([
      { name: 'Widget', updates: 1234 },
    ] as never);

    setup(queryClient, 'supplier-42');

    await waitFor(() => expect(screen.getByTestId('bar-chart')).toBeInTheDocument());

    expect(lastXTickFormatter?.(1234)).toBe('1,234');
    expect(lastTooltipFormatter?.(1234)).toBe('1,234 updates');
    expect(lastTooltipFormatter?.('n/a')).toBe('n/a');
  });
});
