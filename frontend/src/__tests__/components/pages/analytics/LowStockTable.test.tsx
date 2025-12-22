/**
 * @file LowStockTable.test.tsx
 * @module __tests__/pages/analytics/LowStockTable
 * 
 * @summary
 * Tests for LowStockTable component.
 * Tests supplier requirement, data fetching, deficit calculation, and empty states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LowStockRow } from '../../../../api/analytics';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../../api/analytics', () => ({
  getLowStockItems: vi.fn(),
}));

vi.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US',
    },
  }),
}));

vi.mock('../../../../pages/analytics/blocks/low-stock/LowStockTableHeader', () => ({
  LowStockTableHeader: () => <thead data-testid="low-stock-table-header"><tr><th>Header</th></tr></thead>,
}));

vi.mock('../../../../pages/analytics/blocks/low-stock/LowStockTableRows', () => ({
  LowStockTableRows: vi.fn(({ rows }) => (
    <tbody data-testid="low-stock-table-rows">
      {rows.map((row: { itemName?: string }, index: number) => (
        <tr key={index}>
          <td>{row.itemName}</td>
        </tr>
      ))}
    </tbody>
  )),
}));

const { getLowStockItems } = await import('../../../../api/analytics');
const LowStockTable = (await import('../../../../pages/analytics/blocks/low-stock/LowStockTable')).default;

describe('LowStockTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
  });

  const renderTable = (props: { supplierId?: string; from?: string; to?: string; limit?: number } = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <LowStockTable supplierId="" {...props} />
      </QueryClientProvider>
    );
  };

  it('shows select supplier message when no supplier provided', () => {
    renderTable();
    expect(screen.getByText('analytics:selectSupplier')).toBeInTheDocument();
  });

  it('does not fetch data when no supplier provided', () => {
    renderTable();
    expect(getLowStockItems).not.toHaveBeenCalled();
  });

  it('fetches data when supplier is provided', async () => {
    const mockData: LowStockRow[] = [
      { itemName: 'Item A', quantity: 5, minimumQuantity: 10 },
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(mockData);

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getLowStockItems).toHaveBeenCalledWith('sup-123', { from: '2025-01-01', to: '2025-12-31' });
    });
  });

  it('renders loading skeleton when fetching data', () => {
    vi.mocked(getLowStockItems).mockReturnValue(new Promise(() => {}));
    renderTable({ supplierId: 'sup-123' });
    const skeleton = document.querySelector('.MuiSkeleton-root');
    expect(skeleton).toBeInTheDocument();
  });

  it('shows error message on fetch error', async () => {
    vi.mocked(getLowStockItems).mockRejectedValue(new Error('Failed to fetch'));

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('renders table with data', async () => {
    const mockData: LowStockRow[] = [
      { itemName: 'Item A', quantity: 5, minimumQuantity: 10 },
      { itemName: 'Item B', quantity: 2, minimumQuantity: 8 },
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(mockData);

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.getByTestId('low-stock-table-header')).toBeInTheDocument();
      expect(screen.getByTestId('low-stock-table-rows')).toBeInTheDocument();
    });
  });

  it('shows no data message when no low stock items', async () => {
    vi.mocked(getLowStockItems).mockResolvedValue([]);

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(screen.queryByTestId('low-stock-table-rows')).not.toBeInTheDocument();
    });
  });

  it('applies limit prop correctly', async () => {
    const mockData: LowStockRow[] = [
      { itemName: 'Item A', quantity: 5, minimumQuantity: 10 },
      { itemName: 'Item B', quantity: 2, minimumQuantity: 8 },
      { itemName: 'Item C', quantity: 1, minimumQuantity: 5 },
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(mockData);

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31', limit: 2 });

    await waitFor(() => {
      const rows = screen.getByTestId('low-stock-table-rows');
      expect(rows.querySelectorAll('tr')).toHaveLength(2);
    });
  });

  it('refetches when supplierId changes', async () => {
    vi.mocked(getLowStockItems).mockResolvedValue([]);

    const { rerender } = renderTable({ supplierId: 'sup-1', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      expect(getLowStockItems).toHaveBeenCalledTimes(1);
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <LowStockTable supplierId="sup-2" from="2025-01-01" to="2025-12-31" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(getLowStockItems).toHaveBeenCalledTimes(2);
    });
  });

  it('filters out items with no deficit', async () => {
    const mockData: LowStockRow[] = [
      { itemName: 'Item A', quantity: 15, minimumQuantity: 10 }, // No deficit
      { itemName: 'Item B', quantity: 5, minimumQuantity: 10 }, // Has deficit
    ];
    vi.mocked(getLowStockItems).mockResolvedValue(mockData);

    renderTable({ supplierId: 'sup-123', from: '2025-01-01', to: '2025-12-31' });

    await waitFor(() => {
      const rows = screen.getByTestId('low-stock-table-rows');
      expect(rows.querySelectorAll('tr')).toHaveLength(1);
    });
  });
});
