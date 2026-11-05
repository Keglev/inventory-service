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
import { useToast } from '../../../../context/toast/ToastContext';
import { deleteItem } from '../../../../api/inventory/itemMutations';
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

  const handleClose = React.useCallback(() => {
    state.resetAll();
    onClose();
  }, [state, onClose]);

  const handleCancelConfirmation = React.useCallback(() => {
    toast(t('inventory:status.operationCanceled'), 'info');
    state.setShowConfirmation(false);
  }, [state, t, toast]);

  // Not memoized: handleSubmit returns a new function on every render, and `state` is
  // a new object each render, so a useCallback here would never hold.
  const onSubmit = state.handleSubmit(async () => {
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }
    state.setShowConfirmation(true);
  });

  // Deletion is a pure catalog removal; the backend enforces the quantity-zero gate.
  const onConfirmedDelete = React.useCallback(async () => {
    if (!state.selectedItem) {
      state.setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    // Demo mode reaches the confirmation but never deletes
    if (readOnly) {
      state.setFormError(
        t('common:demoDisabled')
      );
      return;
    }

    state.setFormError('');
    state.setShowConfirmation(false);

    try {
      const success = await deleteItem(state.selectedItem.id);

      if (success.ok) {
        toast(
          t(
            'inventory:status.itemDeletedSuccessfully'
          ),
          'success'
        );
        onItemDeleted();
        handleClose();
      } else {
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
