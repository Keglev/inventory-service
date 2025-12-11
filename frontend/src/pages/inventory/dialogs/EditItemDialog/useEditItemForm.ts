/**
 * useEditItemForm - Orchestrator hook for edit item form workflow
 * 
 * @module dialogs/EditItemDialog/useEditItemForm
 * @description
 * Manages all state, queries, and form handling for the edit item workflow:
 * supplier selection → item search → name change validation.
 * 
 * Composes three specialized concerns into a single hook return:
 * - State: supplier, item, search query, error message
 * - Queries: suppliers, items, item details (with smart dependency-driven firing)
 * - Handlers: form submission with validation and API communication
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
} from '../../../../api/inventory/hooks/useInventoryData';

/**
 * Complete edit item form state and handlers
 * 
 * @interface UseEditItemFormReturn
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
      setFormError(t('errors:inventory.selection.noItemSelected', 'Please select an item.'));
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
      } else if (success.error?.includes('Admin') || success.error?.includes('Access denied')) {
        setFormError(t('errors:inventory.adminOnly', 'Only administrators can rename items.'));
      } else if (success.error?.includes('duplicate') || success.error?.includes('already exists')) {
        setFormError(t('errors:inventory.conflicts.duplicateName', 'An item with this name already exists.'));
      } else {
        setFormError(success.error || t('errors:inventory.requests.failedToRenameItem', 'Failed to rename item. Please try again.'));
      }
    } catch (error) {
      console.error('Edit item error:', error);
      setFormError(t('errors:inventory.requests.failedToRenameItem', 'Failed to rename item. Please try again.'));
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
