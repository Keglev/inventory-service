/**
 * @file useDeleteItemState.ts
 * @module pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState
 *
 * @summary
 * Local selection and dialog state for the delete flow: selected supplier
 * and item, search query, error and confirmation flags, plus a
 * react-hook-form instance used as a validation mirror.
 *
 * @enterprise
 * - The selectedItem / selectedSupplier React state is the source of
 *   truth. The react-hook-form instance is a shadow mirror: its itemId
 *   value is pushed via setValue whenever selectedItem changes, and its
 *   handleSubmit is used only to wrap onSubmit. The primary gate against
 *   submitting without a selection is the Delete button's disabled prop
 *   on the parent dialog, not the form's zod schema. Tracked under
 *   CB-APP49 -- either make the form authoritative (drop the local React
 *   state) or remove the form wiring entirely.
 * - Two effects: one resets dependent state when the supplier changes
 *   (item, query, form, error, confirmation flag) so a supplier swap
 *   starts a clean flow; one keeps the form's itemId mirroring the
 *   selected item.
 * - resetAll is exposed for the handler to call on dialog close, so the
 *   next open starts from a known state.
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
      reset();
    },
  };
}

export type UseDeleteItemStateReturn = ReturnType<typeof useDeleteItemState>;
