/**
 * @file useInventoryPageData.test.ts
 * @module __tests__/pages/inventory/hooks/useInventoryPageData
 * @description Inventory data orchestration hook (server page + suppliers +
 * columns + row styling composition).
 *
 * Contract under test:
 * - No supplier selected: the stock of all suppliers is fetched, paged (S2-9).
 * - Supplier selected: getInventoryPage is called with the debounced query,
 *   forwarded 0-based page, sort string, and below-minimum flag.
 * - Fetch failure: logs via logError and resets to an empty page for the
 *   current page/pageSize.
 * - reload(): re-runs the current query, with or without a supplier.
 * - Suppliers query, columns, and row styling are exposed pass-through.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/__tests__/test/queryClient';

const getRowClassNameFn = vi.fn(() => 'row-ok');

vi.mock('@/api/inventory/hooks/useSuppliersQuery', () => ({
  useSuppliersQuery: vi.fn(() => ({
    data: [{ id: 'sup-1', label: 'Alpha' }],
    isLoading: false,
  })),
}));

vi.mock('@/api/inventory/listFetcher', () => ({
  getInventoryPage: vi.fn(),
}));

vi.mock('@/pages/inventory/hooks/useInventoryColumns', () => ({
  useInventoryColumns: vi.fn(() => [{ field: 'name' }]),
}));

vi.mock('@/pages/inventory/hooks/useInventoryRowStyling', () => ({
  useInventoryRowStyling: vi.fn(() => getRowClassNameFn),
}));

// Pass-through debounce keeps the test synchronous; the debounce interval
// itself is covered by the useDebounced unit test.
vi.mock('@/hooks/useDebounced', () => ({
  useDebounced: (value: unknown) => value,
}));

vi.mock('@/utils/logger', () => ({
  logError: vi.fn(),
}));

import { useInventoryPageData } from '@/pages/inventory/hooks/useInventoryPageData';
import { useInventoryColumns } from '@/pages/inventory/hooks/useInventoryColumns';
import { getInventoryPage } from '@/api/inventory/listFetcher';
import { logError } from '@/utils/logger';

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
    { initialProps: { sid: supplierId }, wrapper: createQueryWrapper() }
  );
}

describe('useInventoryPageData', () => {
  beforeEach(() => {
    getInventoryPageMock.mockReset();
    logErrorMock.mockReset();
    getInventoryPageMock.mockResolvedValue(serverPage as never);
  });

  // S2-9: the board no longer waits for a supplier before it lists stock.
  it('fetches the stock of all suppliers when no supplier is selected', async () => {
    const { result } = renderPageData(null);

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(getInventoryPageMock).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: undefined, belowMinimumOnly: false }),
    );
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

  it('empties the page when a reload of a loaded page fails', async () => {
    const { result } = renderPageData('sup-1');
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    getInventoryPageMock.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      result.current.reload();
    });

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(result.current.server.total).toBe(0);
  });

  it('lists the stock of all suppliers when the supplier is deselected after a load', async () => {
    const allPage = { ...serverPage, items: [{ id: 'it-9', name: 'Washer', onHand: 4, minQty: 1 }] };
    const { result, rerender } = renderPageData('sup-1');
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    getInventoryPageMock.mockResolvedValueOnce(allPage as never);

    rerender({ sid: null });

    await waitFor(() => expect(result.current.items[0]?.id).toBe('it-9'));
    expect(getInventoryPageMock).toHaveBeenLastCalledWith(expect.objectContaining({ supplierId: undefined }));
  });

  it('keeps the newest filters when an older request answers last', async () => {
    let answerFirst: (value: unknown) => void = () => {};
    const otherPage = { ...serverPage, items: [{ id: 'it-2', name: 'Gasket', onHand: 9, minQty: 1 }] };
    getInventoryPageMock
      .mockImplementationOnce(() => new Promise((resolve) => { answerFirst = resolve; }) as never)
      .mockResolvedValueOnce(otherPage as never);

    const { result, rerender } = renderPageData('sup-1');
    rerender({ sid: 'sup-2' });
    await waitFor(() => expect(result.current.items[0]?.id).toBe('it-2'));

    // The request for sup-1 answers after the user moved on to sup-2.
    await act(async () => {
      answerFirst(serverPage);
    });

    expect(result.current.items[0]?.id).toBe('it-2');
  });

  it('re-runs the current query on reload when a supplier is selected', async () => {
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

  // The bell's link lists every item below its minimum across suppliers (C6).
  it('fetches all suppliers below minimum when the filter is on without a supplier', async () => {
    const { result } = renderHook(() => useInventoryPageData(null, '', true, 0, 10, 'name,asc'), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(getInventoryPageMock).toHaveBeenCalledWith({
      page: 0, pageSize: 10, q: '', supplierId: undefined, sort: 'name,asc', belowMinimumOnly: true,
    });
  });

  it('asks the columns for a supplier column only without a chosen supplier', async () => {
    const { rerender } = renderPageData(null);
    expect(vi.mocked(useInventoryColumns)).toHaveBeenLastCalledWith(true);

    rerender({ sid: 'sup-1' });
    expect(vi.mocked(useInventoryColumns)).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(getInventoryPageMock).toHaveBeenCalled());
  });

  it('re-runs the current query on reload when no supplier is selected', async () => {
    const { result } = renderPageData(null);
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    const callsAfterMount = getInventoryPageMock.mock.calls.length;

    await act(async () => {
      result.current.reload();
    });

    await waitFor(() =>
      expect(getInventoryPageMock.mock.calls.length).toBe(callsAfterMount + 1)
    );
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
