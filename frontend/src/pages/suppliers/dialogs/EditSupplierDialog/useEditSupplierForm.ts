/**
 * @file useEditSupplierForm.ts
 * @module dialogs/EditSupplierDialog/useEditSupplierForm
 *
 * @summary
 * Hook for supplier editing workflow logic.
 * Handles selection, form state, confirmation, and submission.
 *
 * @enterprise
 * - Two-step workflow: search/select → edit info
 * - Form validation with Zod schema
 * - Server error mapping with intelligent heuristics
 * - Authorization checks (admin-only)
 * - Name field is immutable (cannot be changed)
 */

import * as React from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { updateSupplier, editSupplierSchema, type EditSupplierForm } from '../../../../api/suppliers';
import { useSupplierSearch } from '../DeleteSupplierDialog/useSupplierSearch';
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

  // Form state
  register: UseFormReturn<EditSupplierForm>['register'];
  control: UseFormReturn<EditSupplierForm>['control'];
  formState: UseFormReturn<EditSupplierForm>['formState'];
  handleSubmit: UseFormReturn<EditSupplierForm>['handleSubmit'];
  setValue: UseFormReturn<EditSupplierForm>['setValue'];

  // Confirmation state
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
 * - Form state and validation
 * - Confirmation dialog state
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

  // Search functionality
  const search = useSupplierSearch();

  // Selection state
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingChanges, setPendingChanges] = React.useState<EditSupplierForm | null>(null);

  // Error state
  const [formError, setFormError] = React.useState('');

  // Form management
  const {
    register,
    control,
    handleSubmit,
    formState,
    reset,
    setValue,
  } = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema) as Resolver<EditSupplierForm>,
    defaultValues: {
      supplierId: '',
      contactName: '',
      phone: '',
      email: '',
    },
  });

  /**
   * Pre-fill form when supplier is selected.
   */
  React.useEffect(() => {
    if (selectedSupplier) {
      setValue('supplierId', selectedSupplier.id);
      setValue('contactName', selectedSupplier.contactName || '');
      setValue('phone', selectedSupplier.phone || '');
      setValue('email', selectedSupplier.email || '');
    }
  }, [selectedSupplier, setValue]);

  /**
   * Handle supplier selection from search results.
   * Clears search and pre-fills form.
   */
  const onSelectSupplierAndLoadForm = React.useCallback(
    (supplier: SupplierRow) => {
      setSelectedSupplier(supplier);
      search.resetSearch();
      setFormError('');
    },
    [search]
  );

  /**
   * Handle update confirmation and submission.
   */
  const handleConfirmChanges = React.useCallback(async () => {
    const mapServerError = (errorMsg?: string | null): string => {
      if (!errorMsg) {
        return t('errors:supplier.requests.failedToUpdateSupplier', 'Failed to update supplier. Please try again.');
      }

      const msg = errorMsg.toLowerCase();

      // Admin-only error
      if (msg.includes('admin') || msg.includes('access denied')) {
        return t('errors:supplier.adminOnly', 'Only administrators can edit supplier information.');
      }

      // Missing creator info
      if (msg.includes('createdby')) {
        return t('errors:supplier.validation.createdByRequired', 'Creator information is required. Please ensure you are logged in.');
      }

      // Duplicate email error
      if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('email')) {
        return t('errors:supplier.conflicts.duplicateEmail', 'This email is already in use.');
      }

      return t('errors:supplier.requests.failedToUpdateSupplier', 'Failed to update supplier. Please try again.');
    };

    if (!pendingChanges || !selectedSupplier) return;

    try {
      const response = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name,
        createdBy: user?.email,
        contactName: pendingChanges.contactName,
        phone: pendingChanges.phone,
        email: pendingChanges.email,
      });

      if (response.success) {
        onUpdated();
      } else {
        const errorMessage = mapServerError(response.error);
        setFormError(errorMessage);
        setShowConfirmation(false);
      }
    } catch (err) {
      const errorMessage = mapServerError(err instanceof Error ? err.message : undefined);
      setFormError(errorMessage);
      setShowConfirmation(false);
      console.error('Update failed:', err);
    }
  }, [pendingChanges, selectedSupplier, user?.email, onUpdated, t]);

  /**
   * Reset form to initial state.
   */
  const resetForm = React.useCallback(() => {
    setSelectedSupplier(null);
    search.resetSearch();
    setFormError('');
    setShowConfirmation(false);
    setPendingChanges(null);
    reset();
  }, [search, reset]);

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
    register,
    control,
    formState,
    handleSubmit,
    setValue,

    // Confirmation state
    showConfirmation,
    setShowConfirmation,
    pendingChanges,
    setPendingChanges,

    // Error state
    formError,
    setFormError,

    // Actions
    handleConfirmChanges,
    resetForm,
    onSelectSupplierAndLoadForm,
  };
};
