/**
 * @file useDeleteItemDialog.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/useDeleteItemDialog
 *
 * @summary
 * Orchestrator hook for the delete flow. Composes useDeleteItemState,
 * useDeleteItemQueries, and useDeleteItemHandlers into a single
 * UseDeleteItemDialogReturn object consumed by every view and field.
 *
 * @enterprise
 * - Composition over a god-hook. Each sub-hook owns one concern (state,
 *   data, behavior). This file is the only place that knows about all
 *   three.
 * - The returned shape is what the views and field components depend on,
 *   so adding a new piece of state means updating both the sub-hook and
 *   the explicit composition list here. The trade-off keeps the contract
 *   visible at one site.
 */

import { useDeleteItemState } from './useDeleteItemState';
import { useDeleteItemQueries } from './useDeleteItemQueries';
import { useDeleteItemHandlers } from './useDeleteItemHandlers';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

/**
 * Main delete dialog hook - composes state, queries, and handlers
 *
 * @param dialogOpen - Dialog visibility (enables supplier query)
 * @param onClose - Callback when dialog closes
 * @param onItemDeleted - Callback after successful deletion
 * @param readOnly - Demo mode: allows flow but prevents actual deletion
 * @returns Complete state, queries, and handlers for DeleteItemDialog
 */
export function useDeleteItemDialog(
  dialogOpen: boolean,
  onClose: () => void,
  onItemDeleted: () => void,
  readOnly: boolean = false
): UseDeleteItemDialogReturn {
  // Step 1: Manage all selection and dialog state
  const state = useDeleteItemState();

  // Step 2: Coordinate data queries based on selection state
  const queries = useDeleteItemQueries(
    dialogOpen,
    state.selectedSupplier,
    state.itemQuery,
    state.selectedItem?.id
  );

  // Step 3: Bind event handlers with state and queries
  const handlers = useDeleteItemHandlers(
    state,
    onClose,
    onItemDeleted,
    readOnly
  );

  // Compose: return backwards-compatible shape for DeleteItemDialog components
  return {
    // Selection state - from useDeleteItemState
    selectedSupplier: state.selectedSupplier,
    selectedItem: state.selectedItem,
    itemQuery: state.itemQuery,

    // Dialog state - from useDeleteItemState
    formError: state.formError,
    showConfirmation: state.showConfirmation,
    isSubmitting: state.isSubmitting,

    // Queries - from useDeleteItemQueries
    suppliersQuery: queries.suppliersQuery,
    itemsQuery: queries.itemsQuery,
    itemDetailsQuery: queries.itemDetailsQuery,

    // State setters - from useDeleteItemState
    setSelectedSupplier: state.setSelectedSupplier,
    setSelectedItem: state.setSelectedItem,
    setItemQuery: state.setItemQuery,
    setFormError: state.setFormError,
    setShowConfirmation: state.setShowConfirmation,

    // Handlers - from useDeleteItemHandlers
    handleClose: handlers.handleClose,
    handleCancelConfirmation: handlers.handleCancelConfirmation,
    onSubmit: handlers.onSubmit,
    onConfirmedDelete: handlers.onConfirmedDelete,
  };
}
