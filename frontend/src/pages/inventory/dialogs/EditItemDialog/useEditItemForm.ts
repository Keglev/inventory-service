/**
 * @file useEditItemForm.ts
 * @module pages/inventory/dialogs/EditItemDialog/useEditItemForm
 *
 * @summary
 * Orchestrator hook for the rename flow.
 *
 * @enterprise
 * Owns selection state, the three React Query hooks (suppliers, item search, item
 * details), and the submit handler that calls renameItem.
 *
 * - Single hook rather than the three-way split used in DeleteItemDialog.
 *   The rename flow has no two-stage confirmation, no error-mapping
 *   utility worth extracting, and one mutation -- the cost of splitting
 *   would exceed the benefit.
 * - Two effects: one resets dependent state when the supplier changes
 *   so a supplier swap starts a clean flow; one pre-fills the new-name
 *   field with the freshest known name (details query if present, search
 *   result otherwise) so the user edits an actual value, not an empty
 *   field.
 * - In demo mode (readOnly) every step works, but the submit stops at the demo
 *   notice before the request, as in the sibling dialogs (frontend ADR-0013).
 * - Submission delegates only to renameItem. Failures are classified by the
 *   backend status token (errorToken): 'forbidden' -> admin-only, 'conflict'
 *   -> duplicate name, anything else -> a generic message. This keys on the
 *   structured error shape, never on substrings of the freeform message.
 * - editItemSchema validates only itemId + newName; rename does not
 *   write a StockHistory row, so no reason field is needed. This is
 *   different from itemFormSchema (create, which carries no reason at
 *   all) and quantityAdjustSchema (loose reason string).
 */

import * as React from 'react';
import { useForm, type Control, type UseFormStateReturn, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast/ToastContext';
import { renameItem } from '../../../../api/inventory/itemMutations';
import { editItemSchema, type EditItemForm } from '../../validation/inventoryValidation';
import { useSuppliersQuery } from '../../../../api/inventory/hooks/useSuppliersQuery';
import { useItemSearchQuery } from '../../../../api/inventory/hooks/useItemSearchQuery';
import { useItemDetailsQuery } from '../../../../api/inventory/hooks/useItemDetailsQuery';
import { logError } from '../../../../utils/logger';
import { useItemSelectionState, type ItemSelectionState, type ItemSelectionStateSetters } from '../useItemSelectionState';

/**
 * Complete edit item form state and handlers
 * 

 */
export interface UseEditItemFormReturn extends ItemSelectionState, ItemSelectionStateSetters {
  suppliersQuery: ReturnType<typeof useSuppliersQuery>;
  itemsQuery: ReturnType<typeof useItemSearchQuery>;
  itemDetailsQuery: ReturnType<typeof useItemDetailsQuery>;
  control: Control<EditItemForm>;
  formState: UseFormStateReturn<EditItemForm>;
  setValue: UseFormSetValue<EditItemForm>;
  onSubmit: () => Promise<void>;
  handleClose: () => void;
}

/**
 * Orchestrator hook managing the rename form workflow.
 *
 * @param isOpen - Whether dialog is currently open (controls query firing)
 * @param onClose - Callback when dialog closes
 * @param onItemRenamed - Callback after successful rename
 * @param readOnly - Demo mode: the flow runs, the submit shows the demo notice and sends nothing
 * @returns Complete form state and handlers
 */
export function useEditItemForm(
  isOpen: boolean,
  onClose: () => void,
  onItemRenamed: () => void,
  readOnly = false
): UseEditItemFormReturn {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  const {
    selectedSupplier, setSelectedSupplier, selectedItem, setSelectedItem,
    itemQuery, setItemQuery, formError, setFormError,
  } = useItemSelectionState();

  // Suppliers loaded once when dialog opens
  const suppliersQuery = useSuppliersQuery(isOpen);

  // Supplier's items load once; the query is matched in the browser
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  // Item details fetched when specific item selected
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  const {
    control,
    handleSubmit,
    formState,
    reset,
    setValue,
  } = useForm<EditItemForm>({
    resolver: zodResolver(editItemSchema),
    defaultValues: {
      itemId: '',
      newName: '',
    },
  });

  // A supplier change resets the item, so no value from another supplier survives
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newName', '');
    setFormError('');
  }, [selectedSupplier, setValue, setSelectedItem, setItemQuery, setFormError]);
  // Pre-fills the new name with the fetched name (the search result's until it loads)
  React.useEffect(() => {
    if (!selectedItem) return;
    setValue('itemId', selectedItem.id);
    const effectiveName = itemDetailsQuery.data?.name ?? selectedItem.name;
    setValue('newName', effectiveName);
  }, [selectedItem, itemDetailsQuery.data, setValue]);

  // Clears every value, so the next open starts empty
  const handleClose = () => {
    setSelectedSupplier(null);
    setSelectedItem(null);
    setItemQuery('');
    setFormError('');
    reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }
    if (readOnly) return setFormError(t('common:demoDisabled'));

    setFormError('');

    try {
      const success = await renameItem({
        id: values.itemId,
        newName: values.newName,
      });

      if (success.ok) {
        toast(t('inventory:status.itemRenamed'), 'success');
        onItemRenamed();
        handleClose();
      } else if (success.errorToken === 'forbidden') {
        setFormError(t('errors:inventory.businessRules.adminOnly'));
      } else if (success.errorToken === 'conflict') {
        setFormError(t('errors:inventory.conflicts.duplicateName'));
      } else {
        setFormError(t('errors:inventory.requests.failedToRenameItem'));
      }
    } catch (error) {
      logError('Edit item error:', error);
      setFormError(t('errors:inventory.requests.failedToRenameItem'));
    }
  });

  return {
    selectedSupplier,
    selectedItem,
    itemQuery,
    formError,
    setSelectedSupplier,
    setSelectedItem,
    setItemQuery,
    setFormError,
    suppliersQuery,
    itemsQuery,
    itemDetailsQuery,
    control,
    formState,
    setValue,
    onSubmit,
    handleClose,
  };
}
