/**
 * @file useToolbarHandlers.ts
 * @module pages/inventory/handlers/useToolbarHandlers
 *
 * @summary
 * Custom hook that provides toolbar action event handlers for InventoryBoard.
 * Manages: Add New, Edit, Delete, Adjust Quantity, Change Price button handlers.
 *
 * @enterprise
 * - Separation of concerns: handler logic isolated from component
 * - Clean orchestrator interface
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing toolbar action handlers.
 *
 * @param state - Inventory board state object
 * @returns Object with handler functions for toolbar actions
 *
 * @example
 * ```tsx
 * const { handleAddNew, handleEdit, handleDelete, handleAdjustQty, handleChangePrice } = useToolbarHandlers(state);
 * ```
 */
export function useToolbarHandlers(state: InventoryStateReturn) {
  const handleAddNew = useCallback(() => {
    state.setOpenNew(true);
  }, [state]);

  const handleEdit = useCallback(() => {
    state.setOpenEditName(true);
  }, [state]);

  const handleDelete = useCallback(() => {
    state.setOpenDelete(true);
  }, [state]);

  const handleAdjustQty = useCallback(() => {
    state.setOpenAdjust(true);
  }, [state]);

  const handleChangePrice = useCallback(() => {
    state.setOpenPrice(true);
  }, [state]);

  return {
    handleAddNew,
    handleEdit,
    handleDelete,
    handleAdjustQty,
    handleChangePrice,
  };
}
