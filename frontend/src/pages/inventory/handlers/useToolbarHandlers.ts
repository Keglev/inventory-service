/**
 * @file useToolbarHandlers.ts
 * @module pages/inventory/handlers/useToolbarHandlers
 *
 * @summary
 * Toolbar action handlers: open the corresponding dialog for Add,
 * Edit, Delete, Adjust Quantity, Change Price.
 *
 * @enterprise
 * - Five open-dialog setters mapped to toolbar buttons. handleEdit
 *   opens the rename dialog (openEditName) -- the visible "Edit"
 *   button only allows name changes, reflecting the backend rule that
 *   only ADMIN users can rename items and the rename flow needs its
 *   own validation.
 * - No close logic here. Dialog components own their own close via
 *   setters from the same state bag, so this hook only handles the
 *   open side of the toggle.
 */

import { useCallback } from 'react';
import type { InventoryState, InventoryStateSetters } from '../hooks/useInventoryState';

type InventoryStateReturn = InventoryState & InventoryStateSetters;

/**
 * Hook providing toolbar action handlers.
 *
 * @param state - Inventory board state object
 * @returns Object with handler functions for toolbar actions
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
