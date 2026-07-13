/**
 * @file useInventoryPageData.test.ts
 * @module __tests__/components/pages/inventory/useInventoryPageData
 * @description Inventory data orchestration hook (server page + suppliers +
 * columns + row styling composition).
 *
 * Contract under test:
 * - No supplier selected: no fetch fires; items/total reset to empty.
 * - Supplier selected: getInventoryPage is called with the debounced query,
 *   forwarded 0-based page, sort string, and below-minimum flag.
 * - Fetch failure: logs via logError and resets to an empty page for the
 *   current page/pageSize.
 * - reload(): re-runs the current query only when a supplier is selected.
 * - Suppliers query, columns, and row styling are exposed pass-through.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const getRowClassNameFn = vi.fn(() => 'row-ok');

vi.mock('../../../../api/inventory/hooks/useSuppliersQuery', () => ({
  useSuppliersQuery: vi.fn(() => ({
    data: [{ id: 'sup-1', label: 'Alpha' }],
    isLoading: false,
  })),
}));

vi.mock('../../../../api/inventory/listFetcher', () => ({
  getInventoryPage: vi.fn(),
}));

vi.mock('../../../../pages/inventory/hooks/useInventoryColumns', () => ({
  useInventoryColumns: vi.fn(() => [{ field: 'name' }]),
}));

vi.mock('../../../../pages/inventory/hooks/useInventoryRowStyling', () => ({
  useInventoryRowStyling: vi.fn(() => getRowClassNameFn),
}));

// Pass-through debounce keeps the test synchronous; the debounce interval
// itself is covered by the useDebounced unit test.
vi.mock('../../../../hooks/useDebounced', () => ({
  useDebounced: (value: unknown) => value,
}));

vi.mock('../../../../utils/logger', () => ({
  logError: vi.fn(),
}));

import { useInventoryPageData } from '../../../../pages/inventory/hooks/useInventoryPageData';
import { getInventoryPage } from '../../../../api/inventory/listFetcher';
import { logError } from '../../../../utils/logger';

const getInventoryPageMock = vi.mocked(getInventoryPage);
const logErrorMock = vi.mocked(logError);

const serverPage = {
  items: [{ id: 'it-1', name: 'Widget', onHand: 5, minQty: 2 }],
  total: 1,
  page: 0,
  pageSize: 10,
};

function renderPageData(supplierId: string | null) {
  return renderHook(
    ({ sid }: { sid: string | null }) =>
      useInventoryPageData(sid, 'widget', false, 0, 10, 'name,asc'),
    { initialProps: { sid: supplierId } }
  );
}

describe('useInventoryPageData', () => {
  beforeEach(() => {
    getInventoryPageMock.mockReset();
    logErrorMock.mockReset();
    getInventoryPageMock.mockResolvedValue(serverPage as never);
  });

  it('does not fetch and keeps an empty page when no supplier is selected', async () => {
    const { result } = renderPageData(null);

    expect(getInventoryPageMock).not.toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
    expect(result.current.server.total).toBe(0);
  });

  it('fetches the server page with forwarded filters when a supplier is selected', async () => {
    const { result } = renderPageData('sup-1');

    await waitFor(() => expect(result.current.items).toHaveLength(1));

    expect(getInventoryPageMock).toHaveBeenCalledWith({
      page: 0,
      pageSize: 10,
      q: 'widget',
      supplierId: 'sup-1',
      sort: 'name,asc',
      belowMinimumOnly: false,
    });
    expect(result.current.server).toEqual(serverPage);
    expect(result.current.loading).toBe(false);
  });

  it('logs and resets to an empty page when the fetch fails', async () => {
    getInventoryPageMock.mockRejectedValue(new Error('boom'));

    const { result } = renderPageData('sup-1');

    await waitFor(() => expect(logErrorMock).toHaveBeenCalled());

    expect(logErrorMock).toHaveBeenCalledWith('Failed to load inventory:', expect.any(Error));
    expect(result.current.server).toEqual({ items: [], total: 0, page: 0, pageSize: 10 });
    expect(result.current.loading).toBe(false);
  });

  it('clears items when the supplier is deselected after a successful load', async () => {
    const { result, rerender } = renderPageData('sup-1');
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    rerender({ sid: null });

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(result.current.server.total).toBe(0);
  });

  it('reload re-runs the current query when a supplier is selected', async () => {
    const { result } = renderPageData('sup-1');
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    const callsAfterMount = getInventoryPageMock.mock.calls.length;

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() =>
      expect(getInventoryPageMock.mock.calls.length).toBe(callsAfterMount + 1)
    );
  });

  it('reload is a no-op without a supplier', async () => {
    const { result } = renderPageData(null);

    await act(async () => {
      result.current.reload();
    });

    expect(getInventoryPageMock).not.toHaveBeenCalled();
  });

  it('exposes suppliers, columns, and the row styling function pass-through', async () => {
    const { result } = renderPageData('sup-1');

    expect(result.current.suppliers).toEqual([{ id: 'sup-1', label: 'Alpha' }]);
    expect(result.current.supplierLoading).toBe(false);
    expect(result.current.columns).toEqual([{ field: 'name' }]);
    expect(result.current.getRowClassName(1, 5)).toBe('row-ok');
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
