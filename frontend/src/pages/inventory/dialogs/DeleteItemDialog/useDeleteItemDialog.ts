/**
 * @file useDeleteItemDialog.ts
 * @description
 * Custom hook managing DeleteItemDialog state and lifecycle.
 * Orchestrates selection state, data queries, and deletion workflow.
 *
 * Responsibilities:
 * - Manage supplier and item selection state
 * - Coordinate data fetching queries
 * - Handle dialog lifecycle and state cleanup
 * - Validate user inputs before submission
 *
 * Error handling is delegated to deleteItemErrorHandler.ts
 * for better testability and separation of concerns.
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { deleteItem } from '../../../../api/inventory/mutations';
import { deleteItemSchema, type DeleteItemForm } from '../../../../api/inventory/validation';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../api/inventory/hooks/useInventoryData';
import { handleDeleteError } from './deleteItemErrorHandler';
import type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

/**
 * Manages DeleteItemDialog state and deletion workflow.
 *
 * @param dialogOpen - Whether dialog is currently open
 * @param onClose - Callback to close dialog
 * @param onItemDeleted - Callback after successful deletion
 * @param readOnly - Demo mode: allow UI flow but prevent deletion
 * @returns State and handlers for DeleteItemDialog
 */
export function useDeleteItemDialog(
  dialogOpen: boolean,
  onClose: () => void,
  onItemDeleted: () => void,
  readOnly: boolean = false
): UseDeleteItemDialogReturn {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // Selection state: supplier and item
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);

  // Form inputs
  const [itemQuery, setItemQuery] = React.useState('');
  const [deletionReason, setDeletionReason] = React.useState('');

  // Dialog state
  const [formError, setFormError] = React.useState('');
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  // Data queries
  const suppliersQuery = useSuppliersQuery(dialogOpen);
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  // Form state
  const { handleSubmit, formState: { isSubmitting }, reset, setValue } = useForm<DeleteItemForm>({
    resolver: zodResolver(deleteItemSchema),
    defaultValues: { itemId: '' },
  });

  /**
   * Reset dependent state when supplier changes
   * Ensures data integrity when switching suppliers
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setFormError('');
    setShowConfirmation(false);
  }, [selectedSupplier, setValue]);

  /**
   * Update form itemId when item is selected
   * Keeps form state in sync with UI selection
   */
  React.useEffect(() => {
    if (selectedItem) {
      setValue('itemId', selectedItem.id);
    }
  }, [selectedItem, setValue]);

  /**
   * Close dialog and reset all state
   */
  const handleClose = () => {
    setSelectedSupplier(null);
    setSelectedItem(null);
    setItemQuery('');
    setFormError('');
    setShowConfirmation(false);
    setDeletionReason('');
    reset();
    onClose();
  };

  /**
   * Return to form from confirmation dialog
   */
  const handleCancelConfirmation = () => {
    toast(t('inventory:status.operationCanceled', 'Operation cancelled'), 'info');
    setShowConfirmation(false);
  };

  /**
   * Validate and show confirmation dialog
   */
  const onSubmit = handleSubmit(async () => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
      return;
    }
    setShowConfirmation(true);
  });

  /**
   * Execute deletion after user confirmation
   * Calls backend API and handles various error scenarios
   */
  const onConfirmedDelete = async () => {
    // Validation
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
      return;
    }

    if (!deletionReason) {
      setFormError(
        t('errors:inventory.selection.noReasonSelected', 'Please select a deletion reason.')
      );
      return;
    }

    // Demo mode guard
    if (readOnly) {
      setFormError(
        t('common.demoDisabled', 'You are in demo mode and cannot perform this operation.')
      );
      return;
    }

    setFormError('');
    setShowConfirmation(false);

    try {
      const success = await deleteItem(selectedItem.id, deletionReason);

      if (success.ok) {
        // Success: close and notify
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
        // Error: use error handler to get user-friendly message
        const errorResult = handleDeleteError(success.error, t);
        setFormError(errorResult.message);
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Delete item error:', error);
      setFormError(
        t('errors:inventory.requests.failedToDeleteItem', 'Failed to delete item. Please try again.')
      );
    }
  };

  return {
    selectedSupplier,
    selectedItem,
    itemQuery,
    formError,
    showConfirmation,
    deletionReason,
    isSubmitting,
    suppliersQuery,
    itemsQuery,
    itemDetailsQuery,
    setSelectedSupplier,
    setSelectedItem,
    setItemQuery,
    setFormError,
    setShowConfirmation,
    setDeletionReason,
    handleClose,
    handleCancelConfirmation,
    onSubmit,
    onConfirmedDelete,
  };
}
