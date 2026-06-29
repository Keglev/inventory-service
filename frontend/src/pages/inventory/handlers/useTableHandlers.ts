/**
 * @file useTableHandlers.ts
 * @module pages/inventory/handlers/useTableHandlers
 *
 * @summary
 * Thin DataGrid event handlers: row click selection, pagination change,
 * sort change.
 *
 * @enterprise
 * - Kept as a hook (rather than inline callbacks in the board) so
 *   InventoryBoard receives the same shape from every handler module --
 *   one object of handlers per concern, returned by a hook.
 * - No side effects on row click: selection is decoupled from any
 *   dialog. The toolbar handlers decide when to act on the current
 *   selection.
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
