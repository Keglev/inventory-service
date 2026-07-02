/**
 * @file useEditItemForm.ts
 * @module pages/inventory/dialogs/EditItemDialog/useEditItemForm
 *
 * @summary
 * Orchestrator hook for the rename flow. Owns selection state, the
 * three React Query hooks (suppliers, item search, item details), and
 * the submit handler that calls renameItem.
 *
 * @enterprise
 * - Single hook rather than the three-way split used in DeleteItemDialog.
 *   The rename flow has no two-stage confirmation, no error-mapping
 *   utility worth extracting, and one mutation -- the cost of splitting
 *   would exceed the benefit.
 * - Two effects: one resets dependent state when the supplier changes
 *   so a supplier swap starts a clean flow; one pre-fills the new-name
 *   field with the freshest known name (details query if present, search
 *   result otherwise) so the user edits an actual value, not an empty
 *   field.
 * - Submission delegates only to renameItem. Failures are classified by the
 *   backend status token (errorToken): 'forbidden' -> admin-only, 'conflict'
 *   -> duplicate name, anything else -> a generic message. This keys on the
 *   structured error shape, never on substrings of the freeform message.
 * - console.error on submission failure is unguarded and ships to
 *   production browser devtools. Tracked under CB-APP51 (same class as
 *   CB-APP29 / CB-APP35 / CB-APP37 / CB-APP45 / CB-APP47).
 * - editItemSchema validates only itemId + newName; rename does not
 *   write a StockHistory row, so no reason field is needed. This is
 *   different from itemFormSchema (create/upsert, strict 2-value reason
 *   enum) and quantityAdjustSchema (loose reason string) -- the CB-E
 *   asymmetry does not surface in this file.
 */

import * as React from 'react';
import { useForm, type Control, type UseFormStateReturn, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../../context/toast';
import { renameItem } from '../../../../api/inventory/mutations';
import { editItemSchema, type EditItemForm } from '../../../../api/inventory/validation';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import {
  useSuppliersQuery,
  useItemSearchQuery,
  useItemDetailsQuery,
} from '../../../../api/inventory/hooks';

/**
 * Complete edit item form state and handlers
 * 

 */
export interface UseEditItemFormReturn {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string;
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
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
 * Orchestrator hook managing edit item form workflow
 * 
 * @param isOpen - Whether dialog is currently open (controls query firing)
 * @param onClose - Callback when dialog closes
 * @param onItemRenamed - Callback after successful rename
 * @returns Complete form state and handlers
 * 
 * @enterprise
 * - Smart dependency-driven queries: suppliers only fetched when dialog opens
 * - Item search only fires when supplier selected AND 2+ characters typed
 * - Item details fetched only when item is selected (populated from search)
 * - Form state reset on supplier change to prevent cross-supplier contamination
 * - Complete error handling with user-friendly messages and duplicate detection
 */
export function useEditItemForm(
  isOpen: boolean,
  onClose: () => void,
  onItemRenamed: () => void
): UseEditItemFormReturn {
  const { t } = useTranslation(['common', 'inventory', 'errors']);
  const toast = useToast();

  // ================================
  // State Management
  // ================================

  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  const [itemQuery, setItemQuery] = React.useState('');
  const [formError, setFormError] = React.useState('');

  // ================================
  // Data Queries
  // ================================

  // Suppliers loaded once when dialog opens
  const suppliersQuery = useSuppliersQuery(isOpen);

  // Item search fires when supplier selected AND has query text
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);

  // Item details fetched when specific item selected
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  // ================================
  // Form Management
  // ================================

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

  // ================================
  // Effects
  // ================================

  /**
   * Reset form when supplier changes
   * Prevents cross-supplier data contamination
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newName', '');
    setFormError('');
  }, [selectedSupplier, setValue]);
  /**
   * Pre-fill new name with current item name when details load
   * Uses fetched data (not search placeholder)
   */
  React.useEffect(() => {
    if (!selectedItem) return;
    setValue('itemId', selectedItem.id);
    const effectiveName = itemDetailsQuery.data?.name ?? selectedItem.name;
    setValue('newName', effectiveName);
  }, [selectedItem, itemDetailsQuery.data, setValue]);

  // ================================
  // Handlers
  // ================================

  /**
   * Close dialog with complete state cleanup
   * Prevents state pollution between sessions
   */
  const handleClose = () => {
    setSelectedSupplier(null);
    setSelectedItem(null);
    setItemQuery('');
    setFormError('');
    reset();
    onClose();
  };

  /**
   * Submit form with validation and API call
   * 
   * @enterprise
   * - Validates item selection before submission
   * - Calls backend PATCH /api/inventory/{id}/name?name={newName}
   * - Detects duplicate name conflicts with specific error
   * - Admin-only operation with clear authorization feedback
   * - Triggers parent refresh after successful rename
   */
  const onSubmit = handleSubmit(async (values) => {
    if (!selectedItem) {
      setFormError(t('errors:inventory.selection.noItemSelected'));
      return;
    }

    setFormError('');

    try {
      const success = await renameItem({
        id: values.itemId,
        newName: values.newName,
      });

      if (success.ok) {
        toast(t('inventory:status.itemRenamed', 'Item name changed successfully!'), 'success');
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
      // BUCKET: CB-APP51 -- unguarded console.error ships to production devtools.
      console.error('Edit item error:', error);
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
