/**
 * @file useEditSupplierForm.ts
 * @module pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm
 *
 * @summary
 * Hook for the supplier editing workflow: search, form state, confirmation and the update.
 *
 * @enterprise
 * - Two-step workflow: search/select -> edit info
 * - Delegates form state to useEditSupplierFormState and confirmation to
 *   useEditSupplierConfirmation; mapSupplierError maps server errors
 * - No role check here: the backend answers a non-ADMIN with 403, which the error
 *   mapping shows
 * - The name stays read-only in this UI (the backend would accept a new name); the
 *   update re-sends the current one
 */

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { updateSupplier } from '../../../../api/suppliers/supplierMutations';
import type { EditSupplierForm } from '../../../../api/suppliers/validation';
import { useSupplierSearch } from '../../hooks/useSupplierSearch';
import { useEditSupplierFormState } from './useEditSupplierFormState';
import { useEditSupplierConfirmation } from './useEditSupplierConfirmation';
import { mapSupplierError } from './mapSupplierErrors';
import type { SupplierRow } from '../../../../api/suppliers/types';
import { logError } from '../../../../utils/logger';

/**
 * Hook return type for edit supplier workflow.
 *
 * @interface UseEditSupplierFormReturn
 */
export interface UseEditSupplierFormReturn {
  // Search state (delegated to useSupplierSearch)
  searchQuery: string;
  searchResults: SupplierRow[];
  searchLoading: boolean;
  handleSearchQueryChange: (query: string) => void;

  // Selection state
  selectedSupplier: SupplierRow | null;
  handleSelectSupplier: (supplier: SupplierRow) => void;

  // Form state (delegated to useEditSupplierFormState)
  register: UseFormReturn<EditSupplierForm>['register'];
  control: UseFormReturn<EditSupplierForm>['control'];
  formState: UseFormReturn<EditSupplierForm>['formState'];
  handleSubmit: UseFormReturn<EditSupplierForm>['handleSubmit'];
  setValue: UseFormReturn<EditSupplierForm>['setValue'];

  // Confirmation state (delegated to useEditSupplierConfirmation)
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  pendingChanges: EditSupplierForm | null;
  setPendingChanges: (changes: EditSupplierForm | null) => void;

  // Error state
  formError: string;
  setFormError: (error: string) => void;

  // Actions
  handleConfirmChanges: () => Promise<void>;
  resetForm: () => void;
  onSelectSupplierAndLoadForm: (supplier: SupplierRow) => void;
}

/**
 * Hook for supplier editing workflow.
 *
 * Manages supplier search and selection, form state and validation (delegated),
 * confirmation state (delegated), and submission with error handling.
 *
 * @param onUpdated - Callback after a successful update; the form is already reset when it runs
 * @returns Workflow state and handlers
 */
export const useEditSupplierForm = (
  onUpdated: () => void
): UseEditSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);

  const search = useSupplierSearch();
  const formState = useEditSupplierFormState();
  const confirmation = useEditSupplierConfirmation();

  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  const [formError, setFormError] = React.useState('');

  const onSelectSupplierAndLoadForm = React.useCallback(
    (supplier: SupplierRow) => {
      setSelectedSupplier(supplier);
      formState.populateWithSupplier(supplier);
      search.resetSearch();
      setFormError('');
    },
    [search, formState]
  );

  const resetForm = React.useCallback(() => {
    setSelectedSupplier(null);
    search.resetSearch();
    setFormError('');
    confirmation.reset();
    formState.reset();
  }, [search, confirmation, formState]);

  const handleConfirmChanges = React.useCallback(async () => {
    if (!confirmation.pendingChanges || !selectedSupplier) return;

    try {
      const response = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name,
        contactName: confirmation.pendingChanges.contactName,
        phone: confirmation.pendingChanges.phone,
        email: confirmation.pendingChanges.email,
      });

      if (response.success) {
        // Reset here, before the caller closes: the dialog's success callback
        // cannot reach its own close handler, which is declared after this hook.
        resetForm();
        onUpdated();
      } else {
        setFormError(mapSupplierError(response, t));
        confirmation.setShowConfirmation(false);
      }
    } catch (err) {
      // No envelope is available when something outside the request throws.
      setFormError(mapSupplierError({}, t));
      confirmation.setShowConfirmation(false);
      logError('Update failed:', err);
    }
  }, [confirmation, selectedSupplier, onUpdated, resetForm, t]);

  return {
    // Search state
    searchQuery: search.searchQuery,
    searchResults: search.searchResults,
    searchLoading: search.searchLoading,
    handleSearchQueryChange: search.handleSearchQueryChange,

    // Selection state
    selectedSupplier,
    handleSelectSupplier: onSelectSupplierAndLoadForm,

    // Form state
    register: formState.register,
    control: formState.control,
    formState: formState.formState,
    handleSubmit: formState.handleSubmit,
    setValue: formState.setValue,

    // Confirmation state
    showConfirmation: confirmation.showConfirmation,
    setShowConfirmation: confirmation.setShowConfirmation,
    pendingChanges: confirmation.pendingChanges,
    setPendingChanges: confirmation.setPendingChanges,

    // Error state
    formError,
    setFormError,

    // Actions
    handleConfirmChanges,
    resetForm,
    onSelectSupplierAndLoadForm,
  };
};
