/**
 * @file LowStockTable.test.tsx
 * @module __tests__/pages/analytics/LowStockTable
 *
 * @summary
 * Tests LowStockTable data states, formatting, and query parameters.
 */

import type { ComponentProps } from 'react';
import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LowStockRow } from '@/api/analytics';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
      const template = fallback ?? key;
      if (!params) return template;
      return template.replace(/{{\s*(\w+)\s*}}/g, (_, token: string) =>
        Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : `{{${token}}}`
      );
    },
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        error: { main: '#ff0000' },
        warning: { main: '#ffaa00' },
        success: { main: '#00aa00' },
        text: { primary: '#000000', secondary: '#666666' },
      },
    }),
  };
});

vi.mock('@/api/analytics', () => ({
  getLowStockItems: vi.fn(),
}));

const { getLowStockItems } = await import('@/api/analytics');
const LowStockTable = (await import('@/pages/analytics/blocks/low-stock/LowStockTable')).default;
const mockedGetLowStockItems = getLowStockItems as MockedFunction<typeof getLowStockItems>;

describe('LowStockTable', () => {
  let queryClient: QueryClient;

  const renderTable = (props: ComponentProps<typeof LowStockTable>) =>
    render(
      <QueryClientProvider client={queryClient}>
        <LowStockTable {...props} />
      </QueryClientProvider>
    );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('shows supplier prompt when supplierId is missing', () => {
    renderTable({ supplierId: '' });
    expect(screen.getByText('Select a supplier to see low stock')).toBeInTheDocument();
    expect(getLowStockItems).not.toHaveBeenCalled();
  });

  it('renders loading skeleton while fetching data', () => {
    mockedGetLowStockItems.mockReturnValue(new Promise(() => {}));
    renderTable({ supplierId: 'sup-1' });
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders error state on query failure', async () => {
    mockedGetLowStockItems.mockRejectedValue(new Error('boom'));
    renderTable({ supplierId: 'sup-1' });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('filters, sorts, and renders deficit rows with status chips', async () => {
    const rows: LowStockRow[] = [
      { itemName: 'Item A', quantity: 5, minimumQuantity: 10 },
      { itemName: 'Item B', quantity: 7, minimumQuantity: 10 },
      { itemName: 'Item C', quantity: 12, minimumQuantity: 10 },
    ];
    mockedGetLowStockItems.mockResolvedValue(rows);

    renderTable({ supplierId: 'sup-1' });

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const table = screen.getByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1);

    expect(bodyRows).toHaveLength(2);
    expect(within(bodyRows[0]).getByText('Item A')).toBeInTheDocument();
    expect(within(bodyRows[0]).getByText('Critical')).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText('Item B')).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText('Warning')).toBeInTheDocument();
  });

  it('shows limited notice when more rows exist than limit', async () => {
    const rows: LowStockRow[] = [
      { itemName: 'Item A', quantity: 1, minimumQuantity: 10 },
      { itemName: 'Item B', quantity: 2, minimumQuantity: 10 },
    ];
    mockedGetLowStockItems.mockResolvedValue(rows);

    renderTable({ supplierId: 'sup-1', limit: 1 });

    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 2 items')).toBeInTheDocument();
    });
  });

  it('passes date filters to the API call', async () => {
    mockedGetLowStockItems.mockResolvedValue([]);

    renderTable({ supplierId: 'sup-1', from: '2025-01-01', to: '2025-01-31' });

    await waitFor(() => {
      expect(getLowStockItems).toHaveBeenCalledWith('sup-1', {
        from: '2025-01-01',
        to: '2025-01-31',
      });
    });
  });
});
