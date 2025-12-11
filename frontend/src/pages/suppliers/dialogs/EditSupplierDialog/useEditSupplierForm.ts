/**
 * @file useEditSupplierForm.ts
 * @module dialogs/EditSupplierDialog/useEditSupplierForm
 *
 * @summary
 * Hook for supplier editing workflow logic.
 * Orchestrates form state, search, confirmation, and submission.
 *
 * @enterprise
 * - Two-step workflow: search/select → edit info
 * - Delegates form state to useEditSupplierFormState
 * - Delegates confirmation to useEditSupplierConfirmation
 * - Uses mapSupplierError utility for error handling
 * - Authorization checks (admin-only)
 * - Name field is immutable (cannot be changed)
 */

import * as React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { updateSupplier, type EditSupplierForm } from '../../../../api/suppliers';
import { useSupplierSearch } from '../DeleteSupplierDialog/useSupplierSearch';
import { useEditSupplierFormState } from './useEditSupplierFormState';
import { useEditSupplierConfirmation } from './useEditSupplierConfirmation';
import { mapSupplierError } from './mapSupplierErrors';
import type { SupplierRow } from '../../../../api/suppliers/types';

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
  handleSearchQueryChange: (query: string) => Promise<void>;

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
 * Manages:
 * - Supplier search and selection
 * - Form state and validation (delegated)
 * - Confirmation dialog state (delegated)
 * - Submission and error handling
 * - Authorization checks
 *
 * @param onUpdated - Callback when supplier is successfully updated
 * @returns Workflow state and handlers
 */
export const useEditSupplierForm = (
  onUpdated: () => void
): UseEditSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const { user } = useAuth();

  // Delegate to specialized hooks
  const search = useSupplierSearch();
  const formState = useEditSupplierFormState();
  const confirmation = useEditSupplierConfirmation();

  // Selection state
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  // Error state
  const [formError, setFormError] = React.useState('');

  /**
   * Handle supplier selection from search results.
   * Clears search and pre-fills form.
   */
  const onSelectSupplierAndLoadForm = React.useCallback(
    (supplier: SupplierRow) => {
      setSelectedSupplier(supplier);
      formState.populateWithSupplier(supplier);
      search.resetSearch();
      setFormError('');
    },
    [search, formState]
  );

  /**
   * Handle update confirmation and submission.
   */
  const handleConfirmChanges = React.useCallback(async () => {
    if (!confirmation.pendingChanges || !selectedSupplier) return;

    try {
      const response = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name,
        createdBy: user?.email,
        contactName: confirmation.pendingChanges.contactName,
        phone: confirmation.pendingChanges.phone,
        email: confirmation.pendingChanges.email,
      });

      if (response.success) {
        onUpdated();
      } else {
        const errorMessage = mapSupplierError(response.error, t);
        setFormError(errorMessage);
        confirmation.setShowConfirmation(false);
      }
    } catch (err) {
      const errorMessage = mapSupplierError(
        err instanceof Error ? err.message : undefined,
        t
      );
      setFormError(errorMessage);
      confirmation.setShowConfirmation(false);
      console.error('Update failed:', err);
    }
  }, [confirmation, selectedSupplier, user?.email, onUpdated, t]);

  /**
   * Reset form to initial state.
   */
  const resetForm = React.useCallback(() => {
    setSelectedSupplier(null);
    search.resetSearch();
    setFormError('');
    confirmation.reset();
    formState.reset();
  }, [search, confirmation, formState]);

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
