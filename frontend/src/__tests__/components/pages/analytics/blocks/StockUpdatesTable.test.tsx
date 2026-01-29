/**
 * @file StockUpdatesTable.test.tsx
 * @module __tests__/components/pages/analytics/blocks/StockUpdatesTable
 * @description
 * Enterprise tests for StockUpdatesTable:
 * - Loading state (skeleton)
 * - Empty helper when no rows exist
 * - Renders rows and formats fields (date, delta, reason, user fallback)
 * - Verifies API query parameters (supplierId/from/to/limit)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { StockUpdateRow } from '@/api/analytics/updates';
import { getStockUpdates } from '@/api/analytics/updates';
import StockUpdatesTable from '@/pages/analytics/blocks/StockUpdatesTable';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

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

vi.mock('@/utils/formatters', () => ({
  // Keep formatter behavior deterministic for assertions.
  formatDate: (value: Date) => value.toISOString().slice(0, 10),
  formatNumber: (value: number, _format: string, decimals = 0) => value.toFixed(decimals),
}));

vi.mock('@/api/analytics/updates', () => ({
  getStockUpdates: vi.fn(),
}));

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function setup(
  client: QueryClient,
  props: React.ComponentProps<typeof StockUpdatesTable>,
) {
  return render(
    <QueryClientProvider client={client}>
      <StockUpdatesTable {...props} />
    </QueryClientProvider>,
  );
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('StockUpdatesTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createClient();
  });

  it('renders loading skeleton while fetching updates', () => {
    vi.mocked(getStockUpdates).mockReturnValue(new Promise(() => {}) as Promise<StockUpdateRow[]>);

    const { container } = setup(queryClient, { supplierId: 'sup-1' });

    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows empty helper when there are no updates', async () => {
    vi.mocked(getStockUpdates).mockResolvedValue([]);

    setup(queryClient, { supplierId: 'sup-1' });

    await waitFor(() => {
      expect(screen.getByText('No updates in this period.')).toBeInTheDocument();
    });
  });

  it('renders table rows and formats fields when data exists', async () => {
    const rows: StockUpdateRow[] = [
      {
        timestamp: '2025-02-01T15:30:00Z',
        itemName: 'Widget A',
        delta: -4.5,
        reason: 'SALE',
        user: 'alex',
      },
      {
        timestamp: '2025-02-02T10:00:00Z',
        itemName: 'Widget B',
        delta: 3,
        reason: 'OTHER_REASON',
        user: undefined,
      },
    ];

    vi.mocked(getStockUpdates).mockResolvedValue(rows);

    setup(queryClient, { supplierId: 'sup-9', from: '2025-02-01', to: '2025-02-28' });

    await waitFor(() => {
      expect(getStockUpdates).toHaveBeenCalledWith({
        from: '2025-02-01',
        to: '2025-02-28',
        supplierId: 'sup-9',
        limit: 25,
      });
    });

    const table = await screen.findByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1); // skip header row
    expect(bodyRows).toHaveLength(rows.length);

    const firstRowCells = within(bodyRows[0]).getAllByRole('cell');
    expect(firstRowCells[0]).toHaveTextContent('2025-02-01');
    expect(firstRowCells[1]).toHaveTextContent('Widget A');
    expect(firstRowCells[2]).toHaveTextContent('-4.50');
    expect(firstRowCells[3]).toHaveTextContent('Sale');
    expect(firstRowCells[4]).toHaveTextContent('alex');

    const secondRowCells = within(bodyRows[1]).getAllByRole('cell');
    expect(secondRowCells[0]).toHaveTextContent('2025-02-02');
    expect(secondRowCells[2]).toHaveTextContent('+3');
    expect(secondRowCells[3]).toHaveTextContent('OTHER_REASON');
    expect(secondRowCells[4]).toHaveTextContent('—');
  });
});
