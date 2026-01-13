/**
 * @file useDeleteItemQueries.test.ts
 *
 * @what_is_under_test useDeleteItemQueries hook
 * @responsibility Coordinate supplier, item list, and item detail queries
 * @out_of_scope React Query internals, network transport
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeleteItemQueries } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import type { SupplierOption } from '../../../../../api/analytics/types';

const useSuppliersQueryMock = vi.fn();
const useItemSearchQueryMock = vi.fn();
const useItemDetailsQueryMock = vi.fn();

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: (...args: unknown[]) => useSuppliersQueryMock(...args),
  useItemSearchQuery: (...args: unknown[]) => useItemSearchQueryMock(...args),
  useItemDetailsQuery: (...args: unknown[]) => useItemDetailsQueryMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  useSuppliersQueryMock.mockReturnValue({ data: ['supplier-1'] });
  useItemSearchQueryMock.mockReturnValue({ data: ['item-1'] });
  useItemDetailsQueryMock.mockReturnValue({ data: null });
});

describe('useDeleteItemQueries', () => {
  it('returns composed query results and forwards arguments', () => {
    const supplier: SupplierOption = { id: 'supplier-1', label: 'Supplier 1' };

    const { result } = renderHook(() =>
      useDeleteItemQueries(true, supplier, 'gloves', 'item-1')
    );

    expect(result.current.suppliersQuery).toEqual({ data: ['supplier-1'] });
    expect(result.current.itemsQuery).toEqual({ data: ['item-1'] });
    expect(result.current.itemDetailsQuery).toEqual({ data: null });

    expect(useSuppliersQueryMock).toHaveBeenCalledWith(true);
    expect(useItemSearchQueryMock).toHaveBeenCalledWith(supplier, 'gloves');
    expect(useItemDetailsQueryMock).toHaveBeenCalledWith('item-1');
  });

  it('omits selected item id when none is provided', () => {
    const supplier: SupplierOption = { id: 'supplier-2', label: 'Supplier 2' };

    renderHook(() => useDeleteItemQueries(false, supplier, 'mask'));

    expect(useSuppliersQueryMock).toHaveBeenCalledWith(false);
    expect(useItemSearchQueryMock).toHaveBeenCalledWith(supplier, 'mask');
    expect(useItemDetailsQueryMock).toHaveBeenCalledWith(undefined);
  });
});
