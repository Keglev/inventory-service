/**
 * @file useToolbarHandlers.ts
 * @module pages/suppliers/handlers/useToolbarHandlers
 *
 * @summary
 * Custom hook that provides toolbar action event handlers for SuppliersBoard.
 * Manages: Create, Edit, Delete button click handlers.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { UseSuppliersBoardStateReturn } from '../hooks/useSuppliersBoardState';

/**
 * Hook providing toolbar action handlers.
 *
 * @param state - Suppliers board state object from useSuppliersBoardState
 * @returns Object with handler functions for toolbar actions
 *
 * @example
 * ```tsx
 * const { handleAddNew, handleEdit, handleDelete } = useToolbarHandlers(state);
 * ```
 */
export function useToolbarHandlers(state: UseSuppliersBoardStateReturn) {
  const handleAddNew = useCallback(() => {
    state.setOpenCreate(true);
  }, [state]);

  const handleEdit = useCallback(() => {
    state.setOpenEdit(true);
  }, [state]);

  const handleDelete = useCallback(() => {
    state.setOpenDelete(true);
  }, [state]);

  return {
    handleAddNew,
    handleEdit,
    handleDelete,
  };
}
