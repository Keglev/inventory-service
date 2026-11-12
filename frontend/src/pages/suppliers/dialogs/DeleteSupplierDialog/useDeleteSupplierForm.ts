/**
 * @file useDeleteSupplierForm.ts
 * @module pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm
 *
 * @summary
 * Hook for the supplier deletion workflow: selection, confirmation and the DELETE.
 *
 * @enterprise
 * - Focuses on deletion-specific logic only; search is delegated to useSupplierSearch
 * - Blocks a non-ADMIN in the client; the linked-items rule is the backend's (409)
 * - Server errors are classified from the structured envelope, not the message text
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../../hooks/useAuth';
import { deleteSupplier } from '../../../../api/suppliers/supplierMutations';
import { supplierErrorMessage } from '../supplierServerErrors';
import { useSupplierSearch } from '../../hooks/useSupplierSearch';
import type { SupplierRow } from '../../../../api/suppliers/types';
import { logError } from '../../../../utils/logger';

/**
 * Hook return type for delete supplier workflow.
 * 
 * @interface UseDeleteSupplierFormReturn
 */
export interface UseDeleteSupplierFormReturn {
  // Search state (delegated to useSupplierSearch)
  searchQuery: string;
  searchResults: SupplierRow[];
  searchLoading: boolean;
  handleSearchQueryChange: (query: string) => void;

  // Selection state
  selectedSupplier: SupplierRow | null;
  setSelectedSupplier: (supplier: SupplierRow | null) => void;
  handleSelectSupplier: (supplier: SupplierRow) => void;

  // Confirmation state
  showConfirmation: boolean;
  setShowConfirmation: (show: boolean) => void;
  isDeleting: boolean;
  error: string | null;
  setError: (error: string | null) => void;

  // Actions
  handleConfirmDelete: () => Promise<void>;
  resetForm: () => void;
}

/**
 * Hook for supplier deletion workflow.
 *
 * Manages:
 * - Selection and confirmation state
 * - Deletion submission
 * - Error mapping and display
 * - Authorization checks
 *
 * Uses useSupplierSearch for search functionality.
 *
 * @param onDeleted - Callback when supplier is successfully deleted
 * @param readOnly - Demo session: confirming shows the demo message and sends no request
 * @returns Workflow state and handlers
 */
export const useDeleteSupplierForm = (
  onDeleted: () => void,
  readOnly = false
): UseDeleteSupplierFormReturn => {
  const { t } = useTranslation(['common', 'suppliers', 'errors']);
  const { user } = useAuth();

  const search = useSupplierSearch();

  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierRow | null>(null);

  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelectSupplier = React.useCallback((supplier: SupplierRow) => {
    setSelectedSupplier(supplier);
    search.resetSearch();
    setError(null);
    setShowConfirmation(true);
  }, [search]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!selectedSupplier) {
      setError(t('errors:supplier.selection.noSupplierSelected'));
      return;
    }

    // Ahead of the role check: the demo user's role is DEMO, and the demo message says why
    if (readOnly) {
      setError(t('common:demoDisabled'));
      return;
    }

    if (user?.role !== 'ADMIN') {
      setError(t('errors:supplier.adminOnly'));
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await deleteSupplier(selectedSupplier.id);

      if (response.success) {
        onDeleted();
      } else {
        // On delete, a 409 is the linked-items rule, not a duplicate name.
        setError(supplierErrorMessage(response, t, 'delete'));
      }
    } catch (err) {
      setError(supplierErrorMessage({}, t, 'delete'));
      logError('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedSupplier, user?.role, t, onDeleted, readOnly]);

  /**
   * Reset form to initial state.
   */
  const resetForm = React.useCallback(() => {
    setSelectedSupplier(null);
    search.resetSearch();
    setError(null);
    setShowConfirmation(false);
  }, [search]);

  return {
    // Search state (delegated)
    searchQuery: search.searchQuery,
    searchResults: search.searchResults,
    searchLoading: search.searchLoading,
    handleSearchQueryChange: search.handleSearchQueryChange,

    // Selection state
    selectedSupplier,
    setSelectedSupplier,
    handleSelectSupplier,

    // Confirmation state
    showConfirmation,
    setShowConfirmation,
    isDeleting,
    error,
    setError,

    // Actions
    handleConfirmDelete,
    resetForm,
  };
};
