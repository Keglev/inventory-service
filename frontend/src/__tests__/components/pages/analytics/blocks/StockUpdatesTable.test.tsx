/**
 * @file StockUpdatesTable.test.tsx
 * @module __tests__/pages/analytics/StockUpdatesTable
 */

import type { MockedFunction } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { StockUpdateRow } from '../../../../../api/analytics/updates';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('../../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/dd/yyyy',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('../../../../../utils/formatters', () => ({
  formatDate: (date: Date) => date.toISOString().slice(0, 10),
  formatNumber: (value: number, _format: string, decimals = 0) => value.toFixed(decimals),
}));

vi.mock('../../../../../api/analytics/updates', () => ({
  getStockUpdates: vi.fn(),
}));

const { getStockUpdates } = await import('../../../../../api/analytics/updates');
const StockUpdatesTable = (await import('../../../../../pages/analytics/blocks/StockUpdatesTable')).default;
const mockedGetStockUpdates = getStockUpdates as MockedFunction<typeof getStockUpdates>;

describe('StockUpdatesTable', () => {
  let queryClient: QueryClient;

  const renderTable = (props: React.ComponentProps<typeof StockUpdatesTable>) => (
    render(
      <QueryClientProvider client={queryClient}>
        <StockUpdatesTable {...props} />
      </QueryClientProvider>
    )
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  it('renders loading skeleton while fetching updates', () => {
    mockedGetStockUpdates.mockReturnValue(new Promise(() => {}));
    renderTable({ supplierId: 'sup-1' });

    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows empty helper when there are no updates', async () => {
    mockedGetStockUpdates.mockResolvedValue([]);

    renderTable({ supplierId: 'sup-1' });

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
    mockedGetStockUpdates.mockResolvedValue(rows);

    renderTable({ supplierId: 'sup-9', from: '2025-02-01', to: '2025-02-28' });

    await waitFor(() => {
      expect(mockedGetStockUpdates).toHaveBeenCalledWith({
        from: '2025-02-01',
        to: '2025-02-28',
        supplierId: 'sup-9',
        limit: 25,
      });
    });

    const table = await screen.findByRole('table');
    const bodyRows = within(table).getAllByRole('row').slice(1); // skip header
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
