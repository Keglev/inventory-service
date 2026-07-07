/**
 * @file useFilterHandlers.ts
 * @module pages/inventory/handlers/useFilterHandlers
 *
 * @summary
 * Filter-panel event handlers: search input, supplier selection,
 * below-minimum toggle.
 *
 * @enterprise
 * - Three filter handlers with intentional side effects.
 *   handleSupplierChange clears selection, search, and pagination
 *   because the previously selected item and the search text do not
 *   apply to the new supplier. handleBelowMinChange clears pagination
 *   because the filtered row count usually changes. handleSearchChange
 *   also resets the page index: with server-side pagination a changed
 *   search term invalidates the current page position. Debounce of the
 *   search term is handled downstream in useInventoryPageData.
 * - Pagination reset preserves the user's pageSize choice and only
 *   resets the page index. Row-density preference survives filter
 *   changes.
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing filter panel handlers.
 *
 * @param state - Inventory board state object
 * @returns Object with handler functions for filter actions
 */
export function useFilterHandlers(state: InventoryStateReturn) {
  const handleSearchChange = useCallback(
    (newQ: string) => {
      state.setQ(newQ);
      state.setPaginationModel({ page: 0, pageSize: state.paginationModel.pageSize });
    },
    [state]
  );

  const handleSupplierChange = useCallback(
    (newSupplierId: string | number | null) => {
      state.setSupplierId(newSupplierId);
      state.setSelectedId(null);
      state.setQ('');
      state.setPaginationModel({ page: 0, pageSize: state.paginationModel.pageSize });
    },
    [state]
  );

  const handleBelowMinChange = useCallback(
    (value: boolean) => {
      state.setBelowMinOnly(value);
      state.setPaginationModel({ page: 0, pageSize: state.paginationModel.pageSize });
    },
    [state]
  );

  return {
    handleSearchChange,
    handleSupplierChange,
    handleBelowMinChange,
  };
}
