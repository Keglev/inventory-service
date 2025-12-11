/**
 * @file useFilterHandlers.ts
 * @module pages/inventory/handlers/useFilterHandlers
 *
 * @summary
 * Custom hook that provides filter panel event handlers for InventoryBoard.
 * Manages: Search input, supplier selection, below minimum toggle.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Each handler manages its state updates and side effects
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing filter panel handlers.
 *
 * @param state - Inventory board state object
 * @returns Object with handler functions for filter actions
 *
 * @example
 * ```tsx
 * const { handleSearchChange, handleSupplierChange, handleBelowMinChange } = useFilterHandlers(state);
 * ```
 */
export function useFilterHandlers(state: InventoryStateReturn) {
  const handleSearchChange = useCallback(
    (newQ: string) => {
      state.setQ(newQ);
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
