/**
 * useDeleteItemState - Selection and dialog state management
 *
 * Manages: supplier selection, item selection, search query, deletion reason, error/confirmation states
 * Responsibility: Pure state management with dependency effects
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import { deleteItemSchema, type DeleteItemForm } from '../../../../api/inventory/validation';

export function useDeleteItemState() {
  // Selection state - core domain entities
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);

  // Form inputs
  const [itemQuery, setItemQuery] = React.useState('');
  const [deletionReason, setDeletionReason] = React.useState('');

  // Dialog state
  const [formError, setFormError] = React.useState('');
  const [showConfirmation, setShowConfirmation] = React.useState(false);

  // Form validation state
  const { handleSubmit, formState: { isSubmitting }, reset, setValue } = useForm<DeleteItemForm>({
    resolver: zodResolver(deleteItemSchema),
    defaultValues: { itemId: '' },
  });

  /**
   * Reset dependent state when supplier changes
   * Ensures: item selection, search query, and form state are cleared
   * Prevents: stale data from previous supplier selection
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setFormError('');
    setShowConfirmation(false);
  }, [selectedSupplier, setValue]);

  /**
   * Sync form validation state with UI item selection
   * Ensures: form itemId matches selected item for submission
   * Purpose: keep react-hook-form synchronized with local state
   */
  React.useEffect(() => {
    if (selectedItem) {
      setValue('itemId', selectedItem.id);
    }
  }, [selectedItem, setValue]);

  return {
    // Selection state
    selectedSupplier,
    setSelectedSupplier,
    selectedItem,
    setSelectedItem,

    // Form inputs
    itemQuery,
    setItemQuery,
    deletionReason,
    setDeletionReason,

    // Dialog state
    formError,
    setFormError,
    showConfirmation,
    setShowConfirmation,

    // Form validation
    isSubmitting,
    handleSubmit,
    reset,

    // Reset all state (called on close)
    resetAll: () => {
      setSelectedSupplier(null);
      setSelectedItem(null);
      setItemQuery('');
      setFormError('');
      setShowConfirmation(false);
      setDeletionReason('');
      reset();
    },
  };
}

export type UseDeleteItemStateReturn = ReturnType<typeof useDeleteItemState>;
