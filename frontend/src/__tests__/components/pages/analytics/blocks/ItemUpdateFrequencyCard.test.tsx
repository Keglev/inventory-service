/**
 * @file ItemUpdateFrequencyCard.test.tsx
 * @module __tests__/pages/analytics/ItemUpdateFrequencyCard
 *
 * @summary
 * Tests ItemUpdateFrequencyCard states for missing supplier, loading, and populated data.
 */

import type { ReactNode } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ItemUpdateFrequencyPoint } from '../../../../../api/analytics/frequency';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
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
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Bar: ({ children }: { children?: ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: ({ fill }: { fill?: string }) => <div data-testid="bar-cell" data-fill={fill} />,
}));

vi.mock('../../../../../api/analytics/frequency', () => ({
  getItemUpdateFrequency: vi.fn(),
}));

const { getItemUpdateFrequency } = await import('../../../../../api/analytics/frequency');
const ItemUpdateFrequencyCard = (
  await import('../../../../../pages/analytics/blocks/ItemUpdateFrequencyCard')
).default;
const mockedGetItemUpdateFrequency = getItemUpdateFrequency as MockedFunction<typeof getItemUpdateFrequency>;

describe('ItemUpdateFrequencyCard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderCard = (supplierId?: string | null) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ItemUpdateFrequencyCard supplierId={supplierId} />
      </QueryClientProvider>
    );
  };

  it('renders empty state when supplier is not selected', () => {
    renderCard(null);
    expect(screen.getByText('Select a supplier to view')).toBeInTheDocument();
    expect(getItemUpdateFrequency).not.toHaveBeenCalled();
  });

  it('shows loading skeleton while fetching', () => {
    mockedGetItemUpdateFrequency.mockReturnValue(new Promise(() => {}));
    renderCard('sup-123');
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders bar chart when data resolves', async () => {
    const mockData: ItemUpdateFrequencyPoint[] = [
      { id: 'a', name: 'Item A', updates: 12 },
      { id: 'b', name: 'Item B', updates: 8 },
      { id: 'c', name: 'Item C', updates: 5 },
    ];
    mockedGetItemUpdateFrequency.mockResolvedValue(mockData);

    renderCard('sup-123');

    await waitFor(() => {
      expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-length', '3');
    });

    expect(screen.getAllByTestId('bar-cell')).toHaveLength(mockData.length);
  });

  it('requests data for the provided supplier', async () => {
    mockedGetItemUpdateFrequency.mockResolvedValue([]);

    renderCard('supplier-42');

    await waitFor(() => {
      expect(getItemUpdateFrequency).toHaveBeenCalledWith('supplier-42');
    });
  });
});
