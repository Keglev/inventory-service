/**
 * @file useDeleteItemQueries.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/useDeleteItemQueries
 * @description Composition tests for useDeleteItemQueries.
 *
 * Contract under test:
 * - Coordinates supplier list, item search, and item details queries.
 * - Forwards (dialogOpen, selectedSupplier, itemQuery, selectedItemId) to the underlying inventory hooks.
 * - When selectedItemId is omitted, forwards undefined to the details query.
 *
 * Out of scope:
 * - React Query internals and caching behavior
 * - Network transport / API correctness
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { SupplierOption } from '../../../../../api/analytics/types';

import { useDeleteItemQueries } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const useSuppliersQueryMock = vi.hoisted(() => vi.fn());
const useItemSearchQueryMock = vi.hoisted(() => vi.fn());
const useItemDetailsQueryMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: (...args: unknown[]) => useSuppliersQueryMock(...args),
  useItemSearchQuery: (...args: unknown[]) => useItemSearchQueryMock(...args),
  useItemDetailsQuery: (...args: unknown[]) => useItemDetailsQueryMock(...args),
}));

describe('useDeleteItemQueries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSuppliersQueryMock.mockReturnValue({ data: ['supplier-1'] });
    useItemSearchQueryMock.mockReturnValue({ data: ['item-1'] });
    useItemDetailsQueryMock.mockReturnValue({ data: null });
  });

  it('returns composed query results and forwards arguments', () => {
    const supplier: SupplierOption = { id: 'supplier-1', label: 'Supplier 1' };

    const { result } = renderHook(() => useDeleteItemQueries(true, supplier, 'gloves', 'item-1'));

    // We assert only the stable surface (data wiring), not full query result objects.
    expect(result.current.suppliersQuery.data).toEqual(['supplier-1']);
    expect(result.current.itemsQuery.data).toEqual(['item-1']);
    expect(result.current.itemDetailsQuery.data).toBeNull();

    expect(useSuppliersQueryMock).toHaveBeenCalledWith(true);
    expect(useItemSearchQueryMock).toHaveBeenCalledWith(supplier, 'gloves');
    expect(useItemDetailsQueryMock).toHaveBeenCalledWith('item-1');
  });

  it('forwards undefined to details query when no selected item id is provided', () => {
    const supplier: SupplierOption = { id: 'supplier-2', label: 'Supplier 2' };

    renderHook(() => useDeleteItemQueries(false, supplier, 'mask'));

    expect(useSuppliersQueryMock).toHaveBeenCalledWith(false);
    expect(useItemSearchQueryMock).toHaveBeenCalledWith(supplier, 'mask');
    expect(useItemDetailsQueryMock).toHaveBeenCalledWith(undefined);
  });
});
