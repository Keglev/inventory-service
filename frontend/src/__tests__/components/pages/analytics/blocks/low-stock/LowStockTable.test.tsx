/**
 * @file LowStockTable.test.tsx
 * @module __tests__/components/pages/analytics/blocks/low-stock/LowStockTable
 * @description
 * Enterprise tests for LowStockTable:
 * - Empty state when supplierId is missing
 * - Loading skeleton during fetch
 * - Error state on query failure
 * - Data rendering: filtering to deficit rows, sorting, and status chips
 * - "limit" notice when more rows exist than displayed
 * - API call contract: passes date filters
 *
 * Notes:
 * - We provide a dedicated QueryClient per test to avoid cache cross-talk.
 * - We mock i18n to return fallback strings (stable assertions).
 * - Theme is mocked because the component uses palette colors for status visuals.
 */

import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { LowStockRow } from '@/api/analytics';
import LowStockTable from '@/pages/analytics/blocks/low-stock/LowStockTable';
import { getLowStockItems } from '@/api/analytics';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockGetLowStockItems = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, params?: Record<string, string | number>) => {
      const template = fallback ?? key;
      if (!params) return template;
      return template.replace(/{{\s*(\w+)\s*}}/g, (_m: string, token: string) =>
        Object.prototype.hasOwnProperty.call(params, token) ? String(params[token]) : `{{${token}}}`,
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
  getLowStockItems: mockGetLowStockItems,
}));

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false, // deterministic tests
      },
    },
  });
}

function renderWithQueryClient(props: ComponentProps<typeof LowStockTable>, client: QueryClient) {
  return render(
    <QueryClientProvider client={client}>
      <LowStockTable {...props} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('LowStockTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    queryClient = createQueryClient();
  });

  it('shows a supplier prompt when supplierId is missing and does not call the API', () => {
    renderWithQueryClient({ supplierId: '' }, queryClient);

    expect(screen.getByText('Select a supplier to see low stock')).toBeInTheDocument();
    expect(mockGetLowStockItems).not.toHaveBeenCalled();
  });

  it('renders a loading skeleton while fetching data', () => {
    vi.mocked(getLowStockItems).mockReturnValue(new Promise(() => {}) as Promise<LowStockRow[]>);

    const { container } = renderWithQueryClient({ supplierId: 'sup-1' }, queryClient);

    // MUI Skeleton may not expose accessible roles/names; class check is pragmatic here.
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('renders an error state when the query fails', async () => {
    vi.mocked(getLowStockItems).mockRejectedValue(new Error('boom'));

    renderWithQueryClient({ supplierId: 'sup-1' }, queryClient);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('filters to deficit rows, sorts them, and renders status chips', async () => {
    const rows: LowStockRow[] = [
      { itemName: 'Item A', quantity: 5, minimumQuantity: 10 },  // deficit 5 → critical
      { itemName: 'Item B', quantity: 7, minimumQuantity: 10 },  // deficit 3 → warning
      { itemName: 'Item C', quantity: 12, minimumQuantity: 10 }, // deficit 0 → should be excluded
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(rows);

    renderWithQueryClient({ supplierId: 'sup-1' }, queryClient);

    const table = await screen.findByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1); // drop header row

    // Only deficit rows appear (C excluded). Highest deficit first.
    expect(bodyRows).toHaveLength(2);

    expect(within(bodyRows[0]).getByText('Item A')).toBeInTheDocument();
    expect(within(bodyRows[0]).getByText('Critical')).toBeInTheDocument();

    expect(within(bodyRows[1]).getByText('Item B')).toBeInTheDocument();
    expect(within(bodyRows[1]).getByText('Warning')).toBeInTheDocument();
  });

  it('shows a limit notice when more rows exist than displayed', async () => {
    const rows: LowStockRow[] = [
      { itemName: 'Item A', quantity: 1, minimumQuantity: 10 },
      { itemName: 'Item B', quantity: 2, minimumQuantity: 10 },
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(rows);

    renderWithQueryClient({ supplierId: 'sup-1', limit: 1 }, queryClient);

    await waitFor(() => {
      expect(screen.getByText('Showing 1 of 2 items')).toBeInTheDocument();
    });
  });

  it('passes date filters to the API call', async () => {
    vi.mocked(getLowStockItems).mockResolvedValue([]);

    renderWithQueryClient({ supplierId: 'sup-1', from: '2025-01-01', to: '2025-01-31' }, queryClient);

    await waitFor(() => {
      expect(getLowStockItems).toHaveBeenCalledWith('sup-1', {
        from: '2025-01-01',
        to: '2025-01-31',
      });
    });
  });
});
