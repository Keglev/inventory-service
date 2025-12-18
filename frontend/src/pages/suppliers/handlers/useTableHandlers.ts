/**
 * @file useTableHandlers.ts
 * @module pages/suppliers/handlers/useTableHandlers
 *
 * @summary
 * Custom hook that provides table event handlers for SuppliersBoard.
 * Manages: Row click selection, pagination changes, sort changes.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook providing table handlers.
 *
 * @param state - Suppliers board state object from useSuppliersBoardState
 * @returns Object with handler functions for table actions
 *
 * @example
 * ```tsx
 * const { handleRowClick, handlePaginationChange, handleSortChange } = useTableHandlers(state);
 * ```
 */
export function useTableHandlers(state: UseSuppliersBoardStateReturn) {
  const handleRowClick = useCallback(
    (params: { id: string | number }) => {
      state.setSelectedId(String(params.id));
    },
    [state.setSelectedId]
  );

  const handlePaginationChange = useCallback(
    (newModel: GridPaginationModel) => {
      state.setPaginationModel(newModel);
    },
    [state.setPaginationModel]
  );

  const handleSortChange = useCallback(
    (newModel: GridSortModel) => {
      state.setSortModel(newModel);
    },
    [state.setSortModel]
  );

  return {
    handleRowClick,
    handlePaginationChange,
    handleSortChange,
  };
}
