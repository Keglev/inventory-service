/**
 * @file useDeleteItemHandlers.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers
 *
 * @summary
 * Event handlers for the delete flow: close, cancel-confirmation, submit
 * (form -> confirmation), and confirmed-delete (calls deleteItem).
 *
 * @enterprise
 * - onConfirmedDelete is the only site that actually calls the backend.
 *   The two-dialog architecture funnels every Delete path through this
 *   single function so error-handling, toast, and reset behavior live in
 *   one place.
 * - readOnly short-circuits the delete call but allows the entire UI flow
 *   to proceed. The short-circuit happens after validation so a demo
 *   user sees the same errors a real user would.
 * - Error mapping is delegated to deleteItemErrorHandler so the handler
 *   stays focused on flow control. The mapper branches on the backend's
 *   structured errorToken.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { deleteItem } from '../../../../api/inventory/mutations';
import { handleDeleteError } from './deleteItemErrorHandler';
import type { UseDeleteItemStateReturn } from './useDeleteItemState';
import { logError } from '../../../../utils/logger';

export function useDeleteItemHandlers(
  state: UseDeleteItemStateReturn,
  onClose: () => void,
  onItemDeleted: () => void,
  readOnly: boolean = false
) {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  /**
   * Close dialog handler
   * Action: calls provided onClose callback + resets all local state
   * Effect: makes dialog invisible and clears selection/form data
   * Usage: triggered by cancel buttons or successful deletion
   */
  const handleClose = React.useCallback(() => {
    state.resetAll();
    onClose();
  }, [state, onClose]);

  /**
   * Cancel confirmation handler
   * Action: close confirmation dialog, return to form
   * Effect: shows toast notification of cancellation
   * Usage: when user clicks "No" on confirmation dialog
   */
  const handleCancelConfirmation = React.useCallback(() => {
    toast(t('inventory:status.operationCanceled', 'Operation cancelled'), 'info');
    state.setShowConfirmation(false);
  }, [state, t, toast]);

  /**
   * Form submission handler
   * Validation: ensures item is selected
   * Action: shows confirmation dialog with warning
   * Usage: triggered by "Delete" button in form view
   */
  const onSubmit = state.handleSubmit(
    React.useCallback(async () => {
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }
    // Validation passed: show confirmation dialog
    state.setShowConfirmation(true);
    }, [state, t])
  );

  /**
   * Confirmed deletion handler
   * Validation: item selected, not in readonly mode
   * Action: calls DELETE API with the item ID (deletion is a pure catalog
   * removal; the backend enforces the quantity-zero gate)
   * Response: success closes dialog, error shows message
   * Error handling: delegates to deleteItemErrorHandler for user messages
   */
  const onConfirmedDelete = React.useCallback(async () => {
    // Validation: item required
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    // Guard: readonly mode blocks actual deletion
    if (readOnly) {
      state.setFormError(
        t('common:demoDisabled', 'You are in demo mode and cannot perform this operation.')
      );
      return;
    }

    // Clear previous errors before submission
    state.setFormError('');
    state.setShowConfirmation(false);

    try {
      // Execute deletion: calls DELETE /api/inventory/{id}
      const success = await deleteItem(state.selectedItem.id);

      if (success.ok) {
        // Success path: show message + close + notify parent
        toast(
          t(
            'inventory:status.itemDeletedSuccessfully',
            'Operation successful. Item was removed from inventory!'
          ),
          'success'
        );
        onItemDeleted();
        handleClose();
      } else {
        // Error path: use error handler to map backend error to user message
        const errorResult = handleDeleteError(success, t);
        state.setFormError(errorResult.message);
        state.setShowConfirmation(false);
      }
    } catch (error) {
      logError('Delete item error:', error);
      state.setFormError(t('errors:inventory.requests.failedToDeleteItem'));
    }
  }, [state, readOnly, t, toast, onItemDeleted, handleClose]);

  return {
    handleClose,
    handleCancelConfirmation,
    onSubmit,
    onConfirmedDelete,
  };
}

export type UseDeleteItemHandlersReturn = ReturnType<typeof useDeleteItemHandlers>;
