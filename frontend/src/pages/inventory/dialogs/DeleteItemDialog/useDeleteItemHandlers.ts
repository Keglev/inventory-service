/**
 * useDeleteItemHandlers - Event handlers and deletion workflow
 *
 * Manages: form submission, deletion confirmation, API call execution
 * Responsibility: Business logic orchestration with error handling
 * Dependencies: state setters, queries, API mutations, error handler
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { deleteItem } from '../../../../api/inventory/mutations';
import { handleDeleteError } from './deleteItemErrorHandler';
import type { UseDeleteItemStateReturn } from './useDeleteItemState';
import type { UseDeleteItemQueriesReturn } from './useDeleteItemQueries';

export function useDeleteItemHandlers(
  state: UseDeleteItemStateReturn,
  _queries: UseDeleteItemQueriesReturn,
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
      state.setFormError(
        t('errors:inventory.selection.noItemSelected', 'Please select an item.')
      );
      return;
    }
    // Validation passed: show confirmation dialog
    state.setShowConfirmation(true);
    }, [state, t])
  );

  /**
   * Confirmed deletion handler
   * Validation: item selected, reason provided, not in readonly mode
   * Action: calls DELETE API with item ID and reason
   * Response: success closes dialog, error shows message
   * Error handling: delegates to deleteItemErrorHandler for user messages
   */
  const onConfirmedDelete = React.useCallback(async () => {
    // Validation: item required
    if (!state.selectedItem) {
      state.setFormError(
        t('errors:inventory.selection.noItemSelected', 'Please select an item.')
      );
      return;
    }

    // Validation: reason required
    if (!state.deletionReason) {
      state.setFormError(
        t('errors:inventory.selection.noReasonSelected', 'Please select a deletion reason.')
      );
      return;
    }

    // Guard: readonly mode blocks actual deletion
    if (readOnly) {
      state.setFormError(
        t('common.demoDisabled', 'You are in demo mode and cannot perform this operation.')
      );
      return;
    }

    // Clear previous errors before submission
    state.setFormError('');
    state.setShowConfirmation(false);

    try {
      // Execute deletion: calls DELETE /api/inventory/{id}?reason=...
      const success = await deleteItem(state.selectedItem.id, state.deletionReason);

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
        const errorResult = handleDeleteError(success.error, t);
        state.setFormError(errorResult.message);
        state.setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Delete item error:', error);
      state.setFormError(
        t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.')
      );
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
