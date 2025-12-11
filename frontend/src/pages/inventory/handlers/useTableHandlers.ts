/**
 * @file useTableHandlers.ts
 * @module pages/inventory/handlers/useTableHandlers
 *
 * @summary
 * Custom hook that provides table event handlers for InventoryBoard.
 * Manages: Row click selection, pagination changes, sort changes.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing table handlers.
 *
 * @param state - Inventory board state object
 * @returns Object with handler functions for table actions
 *
 * @example
 * ```tsx
 * const { handleRowClick, handlePaginationChange, handleSortChange } = useTableHandlers(state);
 * ```
 */
export function useTableHandlers(state: InventoryStateReturn) {
  const handleRowClick = useCallback(
    (id: string) => {
      state.setSelectedId(id);
    },
    [state]
  );

  const handlePaginationChange = useCallback(
    (newModel: GridPaginationModel) => {
      state.setPaginationModel(newModel);
    },
    [state]
  );

  const handleSortChange = useCallback(
    (newModel: GridSortModel) => {
      state.setSortModel(newModel);
    },
    [state]
  );

  return {
    handleRowClick,
    handlePaginationChange,
    handleSortChange,
  };
}
